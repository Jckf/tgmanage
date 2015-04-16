#! /usr/bin/perl
use strict;
use warnings;
use DBI;
package nms::config;

# DB
our $db_name = "nms";
our $db_host = "frank.tg14.gathering.org";
our $db_username = "nms";
our $db_password = "<removed>";

# TACACS-login for NMS
our $tacacs_user = "nms";
our $tacacs_pass = "<removed>";

# SNMP read-only for NMS, etc
our $snmp_community = "<removed>";

# Telnet-timeout for smanagrun
our $telnet_timeout = 30;

# IP/IPv6/DNS-info
our $tgname = "tg14";
our $pri_hostname = "brad";
our $pri_v4 = "151.216.254.2";
our $pri_v6 = "2a02:ed02:254::2";
our $pri_net_v4 = "151.216.254.0/24";
our $pri_net_v6 = "2a02:ed02:1ee7::/64";

our $sec_hostname = "janet";
our $sec_v4 = "151.216.253.2";
our $sec_v6 = "2a02:ed02:253::2";
our $sec_net_v4 = "151.216.253.0/24";
our $sec_net_v6 = "2a02:ed02:1337::/64";

# for RIPE to get reverse zones via DNS AXFR
# https://www.ripe.net/data-tools/dns/reverse-dns/how-to-set-up-reverse-delegation
our $ext_xfer  = "193.0.0.0/22; 2001:610:240::/48; 2001:67c:2e8::/48";

# allow XFR from NOC
our $noc_net  = "151.216.252.0/24; 2a02:ed02:252::/64";

# To generate new dnssec-key for ddns:
# dnssec-keygen -a HMAC-MD5 -b 128 -n HOST DHCP_UPDATER
our $ddns_key = "<removed>";
our $ddns_to  = "127.0.0.1"; # just use localhost

# Base networks
our $base_ipv4net = "151.216.128.0/17";
our $base_ipv6net = "2a02:ed02::/32";
our $ipv6zone = "2.0.d.e.2.0.a.2.ip6.arpa";

# extra networks that are outside the normal ranges
# that should have recursive DNS access
our $rec_net = "185.12.59.0/24";

# extra networks that are outside the normal ranges
# that should be added to DNS
our @extra_nets = (
	'185.12.59.0/24',  # Norsk nett
);

# add WLC's
our $wlc1 = "151.216.253.21";

# add VOIP-server
our $voip1 = "134.90.150.162";

# PXE-server (rest of bootstrap assumes $sec_v4/$sec_v6)
our $pxe_server_v4 = $sec_v4;
our $pxe_server_v6 = $sec_v6;

1;
