#! /usr/bin/perl
# vim:ts=8:sw=8
use strict;
use warnings;
use utf8;
use DBI;
use Data::Dumper;
use JSON;
use nms;
package nms::web;

use base 'Exporter';
our %get_params;
our %json;
our @EXPORT = qw(finalize_output json dbh db_safe_quote %get_params get_input %json);
our $dbh;
our $now;
our $when;
our $ifname;
our %cc;

sub get_input {
	my $in = "";
	while(<STDIN>) { $in .= $_; }
	return $in;
}
# Print cache-control from %cc
sub printcc {
	my $line = "";
	my $first = "";
	foreach my $tmp (keys(%cc)) {
		$line .= $first . $tmp . "=" . $cc{$tmp};
		$first = ", ";
	}
	print 'Cache-Control: ' . $line . "\n";
}

sub db_safe_quote {
	my $word = $_[0];
	my $term = $get_params{$word};
	if (!defined($term)) {
		if(defined($_[1])) {
			$term = $_[1];
		} else {
			die "Missing CGI param $word";
		}
	}
	return $dbh->quote($term) || die;
}

# returns a valid $when statement
# Also sets cache-control headers if time is overridden
sub setwhen {
	my $when;
	$now = "now()";
	if (defined($get_params{'now'})) {
		$now = db_safe_quote('now') . "::timestamp ";
		$cc{'max-age'} = "3600";
	}
	$when = " time > " . $now . " - '5m'::interval and time < " . $now . " ";
	return $when;
}

sub ispublic() {
	if (defined($get_params{'public'}) || $ENV{'REMOTE_USER'} eq "public") {
		return 1;
	} else {
		return 0;
	}
}
# Sets the ifname. If we are logged in, it's simply set to "ifname", otherwise
# it's hashed for anonymization.
sub  obfuscateifname {
	my $ifname = "ifname";
	if (defined($get_params{'public'})) {
		$ifname = "regexp_replace(ifname, 'ge-0/0/(([0-3][0-9])|(4[0-3])|([0-9]))\$',concat('ge-participant',sha1_hmac(ifname::bytea,'".$nms::config::nms_hash."'::bytea))) as ifname";
	}
	return $ifname;
}

sub finalize_output {
	my $query;
	$query = $dbh->prepare ('select ' . $now . ' as time;');
	$query->execute();

	$json{'time'} = $query->fetchrow_hashref()->{'time'};
	printcc;

	print "Content-Type: text/jso; charset=utf-8\n\n";
	print JSON::XS::encode_json(\%json);
	print "\n";
}

sub populate_params {
	foreach my $hdr (split("&",$ENV{'QUERY_STRING'} || "")) {
		my ($key, $value) = split("=",$hdr,"2");
		$get_params{$key} = $value;
	}
}

BEGIN {
	$cc{'stale-while-revalidate'} = "3600";
	$cc{'max-age'} = "20";

	$dbh = nms::db_connect();
	populate_params();
	# FIXME: Shouldn't be magic.
	# Only used for setting time in result from DB time.
	# FIXME: Clarification, this _has_ to be set before setwhen is run,
	# since it secretly overrides it.
	$when = setwhen();
	$ifname = obfuscateifname();
}
1;
