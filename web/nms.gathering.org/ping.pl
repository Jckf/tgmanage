#! /usr/bin/perl
use lib '../../include';
use nms::web;

my $q = $nms::web::dbh->prepare("SELECT DISTINCT ON (sysname) time,sysname, latency_ms FROM ping NATURAL JOIN switches WHERE time in (select max(time) from ping where " . $nms::web::when . " group by switch)");
$q->execute();
while (my $ref = $q->fetchrow_hashref()) {
	$nms::web::json{'switches'}{$ref->{'sysname'}}{'latency'} = $ref->{'latency_ms'};
}

my $qs = $nms::web::dbh->prepare("SELECT DISTINCT ON (switch) switch, latency_ms FROM ping_secondary_ip WHERE " . $nms::web::when .  " ORDER BY switch, time DESC;");
$qs->execute();
while (my $ref = $qs->fetchrow_hashref()) {
	$nms::web::json{'switches'}{$ref->{'switch'}}{'latency_secondary'} = $ref->{'latency_ms'};
}

my $lq = $nms::web::dbh->prepare("SELECT DISTINCT ON (linknet) linknet, latency1_ms, latency2_ms FROM linknet_ping WHERE ". $nms::web::when . " ORDER BY linknet, time DESC;");
$lq->execute();
while (my $ref = $lq->fetchrow_hashref()) {
	$nms::web::json{'linknets'}{$ref->{'linknet'}} = [ $ref->{'latency1_ms'}, $ref->{'latency2_ms'} ];
}

$q->execute();

finalize_output();
