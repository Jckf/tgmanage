#! /usr/bin/perl
use CGI;
use DBI;
use POSIX;
use lib '../../include';
use strict;
use warnings;
use nms;
use JSON::XS;
use Digest::MD5;

my $cgi = CGI->new;
my $secret = $cgi->param('secret');
my $noise = $cgi->param('noise') // 0;
my $dbh = nms::db_connect();

my %json = ();
my $q = $dbh->prepare("select * from ( SELECT switch,sysname,sum(bytes_in) AS bytes_in,sum(bytes_out) AS bytes_out from switches natural left join get_current_datarate() where ip <> inet '127.0.0.1' group by switch,sysname) t1 natural join placements order by zorder;");
$q->execute();
while (my $ref = $q->fetchrow_hashref()) {

	# for now:
	# 10Mbit/switch = green
	# 100Mbit/switch = yellow
	# 1Gbit/switch = red
	# 10Gbit/switch = white
	
	my $clr;

	if (defined($ref->{'bytes_in'})) {
		my $intensity = 0.0;
		my $traffic = 4.0 * ($ref->{'bytes_in'} + $ref->{'bytes_out'});  # average and convert to bits (should be about the same in practice)

		my $max = 100_000_000_000.0;   # 100Gbit
		my $min =      10_000_000.0;   # 10Mbit
		if ($traffic >= $min) {
			$intensity = log($traffic / $min) / log(10);

			my $fudge = oct('0x'.substr(Digest::MD5::md5_hex($cgi->{'sysname'} . $cgi->param('secret')), 0, 8));
			$intensity += $fudge * $noise;

			$intensity = 4.0 if ($intensity > 4.0);
		}
		$clr = get_color($intensity);
	} else {
		$clr = [ 0, 0, 255 ];
	}

	$clr = sprintf("#%02x%02x%02x",
		POSIX::floor($clr->[0] + 0.5),
		POSIX::floor($clr->[1] + 0.5),
		POSIX::floor($clr->[2] + 0.5));

	$json{'switches'}{$ref->{'switch'}}{'color'} = $clr;
}
$dbh->disconnect;
print CGI::header(-type=>'text/json; charset=utf-8');
print JSON::XS::encode_json(\%json);

sub get_color {
	my $intensity = shift;
	my $gamma = 1.0/1.90;
	if ($intensity > 3.0) {
		return [ 255.0 * ((4.0 - $intensity) ** $gamma), 255.0 * ((4.0 - $intensity) ** $gamma), 255.0 * ((4.0 - $intensity) ** $gamma) ];
	} elsif ($intensity > 2.0) {
		return [ 255.0, 255.0 * (($intensity - 2.0) ** $gamma), 255.0 * (($intensity - 2.0) ** $gamma) ];
	} elsif ($intensity > 1.0) {
		return [ 255.0, 255.0 * ((2.0 - $intensity) ** $gamma), 0 ];
	} else {
		return [ 255.0 * ($intensity ** $gamma), 255, 0 ];
	}
}
