#! /usr/bin/perl
# vim:ts=8:sw=8
use lib '../../include';
use utf8;
use nms::web;
use strict;
use warnings;

my $data = db_safe_quote('comment');
my $switch = db_safe_quote('switch');
my $user = $dbh->quote($cgi->remote_user() || "undefined");

my $q = $nms::web::dbh->prepare("INSERT INTO switch_comments (time,username,switch,comment) values (now(),$user,(select switch from switches where sysname = $switch limit 1),$data)");
$q->execute();

$nms::web::cc{'max-age'} = '0';
$nms::web::cc{'stale-while-revalidate'} = '0';
$nms::web::json{'state'} = 'ok';

finalize_output();
