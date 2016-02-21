#! /usr/bin/perl
# vim:ts=8:sw=8

use lib '../../include';
use nms::web;
use strict;
use warnings;
use Data::Dumper;

my $query = $nms::web::dbh->prepare('select sysname,extract(epoch from date_trunc(\'second\',time)) as time,state,username,id,comment from switch_comments natural join switches where state != \'delete\' order by time desc limit 1');
$query->execute();
while (my $ref = $query->fetchrow_hashref()) {
	push @{$nms::web::json{'comments'}{$ref->{'sysname'}}{'comments'}},$ref;
}

nms::web::finalize_output();
