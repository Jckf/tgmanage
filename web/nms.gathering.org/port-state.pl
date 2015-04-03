#! /usr/bin/perl
use CGI qw(fatalsToBrowser);
use DBI;
use lib '../../include';
use nms;
use strict;
use warnings;
use Data::Dumper;

my $cgi = CGI->new;

my $dbh = nms::db_connect();

my $switch = $cgi->param('switch');
my @ports = split(",",$cgi->param('ports'));
my @fields = split(",",$cgi->param('fields'));
my $cin = $cgi->param('time');
my $when;
if (!defined($cin)) {
	$when =" time > now() - '5m'::interval";
} else {
	$when = " time < now() - '$cin'::interval and time > now() - ('$cin'::interval + '25m'::interval) ";
}

if (!(@fields)) {
 @fields = ('ifhighspeed','ifhcoutoctets','ifhcinoctets');
}
my $query = 'select distinct on (switch,ifname';
my $val;
foreach $val (@fields) {
	$query .= ",$val";
}
$query .= ') extract(epoch from date_trunc(\'second\',time)) as time,switch,ifname';
foreach $val (@fields) {
	$query .= ",max($val) as $val";
}
$query .= ',switches.sysname from polls natural join switches where ' . $when . ' ';
my $or = "and (";
my $last = "";
foreach my $port (@ports) {
	$query .= "$or ifname = '$port' ";
	$or = " OR ";
	$last = ")";
}
$query .= "$last";
if (defined($switch)) {
	$query .= "and sysname = '$switch'";
}
$query .= 'group by time,switch,ifname';
foreach $val (@fields) {
	$query .= ",$val";
}
$query .= ',sysname order by switch,ifname';
foreach $val (@fields) {
	$query .= ",$val";
}
$query .= ',time desc';
my $q = $dbh->prepare($query);
$q->execute();

my %json = ();
while (my $ref = $q->fetchrow_hashref()) {
	foreach $val (@fields) {
		$json{'switches'}{$ref->{'sysname'}}{'ports'}{$ref->{'ifname'}}{$val} = $ref->{$val};
	}
	$json{'switches'}{$ref->{'sysname'}}{'ports'}{$ref->{'ifname'}}{'time'} = $ref->{'time'};
}
#print Dumper(%json);

 $q = $dbh->prepare('select switch,sysname,placement,zorder,ip,switchtype,poll_frequency,community,last_updated from switches natural join placements');
my  $q2 = $dbh->prepare('select distinct on (switch) switch,temp,time,sysname from switch_temp natural join switches order by switch,time desc');

$q->execute();
while (my $ref = $q->fetchrow_hashref()) {
	$ref->{'placement'} =~ /\((-?\d+),(-?\d+)\),\((-?\d+),(-?\d+)\)/;
	my ($x1, $y1, $x2, $y2) = ($1, $2, $3, $4);
	my $sysname = $ref->{'sysname'};
	$json{'switches'}{$ref->{'sysname'}}{'switchtype'} = $ref->{'switchtype'};
	$json{'switches'}{$ref->{'sysname'}}{'management'}{'ip'} = $ref->{'ip'};
	$json{'switches'}{$ref->{'sysname'}}{'management'}{'poll_frequency'} = $ref->{'poll_frequency'};
	$json{'switches'}{$ref->{'sysname'}}{'management'}{'community'} = $ref->{'community'};
	$json{'switches'}{$ref->{'sysname'}}{'management'}{'last_updated'} = $ref->{'last_updated'};
	$json{'switches'}{$ref->{'sysname'}}{'placement'}{'x'} = $x2;
	$json{'switches'}{$ref->{'sysname'}}{'placement'}{'y'} = $y2;
	$json{'switches'}{$ref->{'sysname'}}{'placement'}{'width'} = $x1 - $x2;
	$json{'switches'}{$ref->{'sysname'}}{'placement'}{'height'} = $y1 - $y2;
	$json{'switches'}{$ref->{'sysname'}}{'placement'}{'zorder'} = $ref->{'zorder'};
}
$q2->execute();
while (my $ref = $q2->fetchrow_hashref()) {
	my $sysname = $ref->{'sysname'};
	$json{'switches'}{$ref->{'sysname'}}{'temp'} = $ref->{'temp'};
	$json{'switches'}{$ref->{'sysname'}}{'temp_time'} = $ref->{'time'};
}

$q = $dbh->prepare(' select linknet, (select sysname from switches where switch = switch1) as sysname1, addr1, (select sysname from switches where switch = switch2) as sysname2,addr2 from linknets');
$q->execute();
while (my $ref = $q->fetchrow_hashref()) {
	push @{$json{'linknets'}}, $ref;
}

print $cgi->header(-type=>'text/json; charset=utf-8');
print JSON::XS::encode_json(\%json);
