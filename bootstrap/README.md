Outline:
------------------------------------------------------------------

  1. Install OS on three boxes
  2. Bootstrap:
     * Install tgmanage on one, the bootstrap (tools, include, netlist.txt)
     * Install dependencies on bootstrap
     * Push SSH key key to the other boxes (init-sshkeys.sh)
     * Update configuration
     * Update netlist.txt
     * Bootstrap the primary and secondary (make-base-requires.sh)
  3. Create new networks/scopes/zones Update during the party using 
    update-baseservice.sh from bootstrap
  4. Apply changes usling bootstrap/apply-baseupdate.sh (reloads bind, restarts dhcpd)
  5. Changes to generated scopes, pools, zones are done on the primary, in the files
  6. If tools need patching, patch on boot and push with update-tools.sh
  7. Before wednesday evening, the infra.tgXX.gathering.org zone should be updated!

**Only use make-base-requires.sh during bootstrap !!!!!!! :P**

Detailed instructions and description:
==================================================================
 
1: Install Debian
------------------------------------------------------------------

The following three hosts/servers are normally used:
  * A 'bootstrap' box. This server will be used to configure
    the first TG-servers, and may end up hosting the switch-config and NMS.
  * The server to use as Primary DNS and DHCP server
  * The server to use as Secondary DNS and SMTP.

2: Perform bootstrapping
------------------------------------------------------------------

Start by placing the 'tgmanage' directory as '/root/tgmanage' on the bootstrap
box.  Change into the 'tgmanage' directory. Next, run
'bootstrap/install-dependencies.sh boot'


Edit 'include/config.local.pm' and update for this year's TG.  Use
'bootstrap/create-shellconf.pl' to extract configuration from the perl module to
create/update the 'include/tgmanage.cfg.sh' configuration script.

Run 'bootstrap/create-hostsfile.sh' to make sure the bootstrap-box can use
hostnames to reach the pri/sec DNS even before DNS is set up.

The tools make extensive use of key-based SSH logins, to make this work
seamlessly, run 'bootstrap/init-sshkeys.sh' to create an RSA priv/pub keypair, and
push the pubkey to the Primary and Secondary boxes.


The Network-list is _not_ automagically updated. A copy of last year's
netlist.txt should be included in the goodiebag. With that as a base, update
for this year's address plan. Remember that client nets in the hall are
supposed to be pulled from switches.txt ...
The rest of the information needed should be pulled from techwiki.g.o The
format of the file is: one net per line, lines starting with # are skipped,
format of each net-line is:

	# <v4 net> <v6 net> <network-name>
	151.216.129.0/26 2a02:ed02:129a::/64 noc


Run 'bootstrap/make-base-requires.sh'. This script will log in on the Primary and
Secondary boxes, install dependencies and the BIND/DHCP packages, create all
needed directories, create the initial configuration files.

A short listing of the tasks of scripts called by make-base-requires (NOTE: these 
scripts are run by bootstrap/make-base-requires.sh, you should not need to run these individually):
  * bootstrap/install-dependencies.sh
    * Installs needed base software to boot, primary and secondary
  * bootstrap/make-named.pl
    * Basic BIND setup (creates named.conf et.al)
  * bootstrap/make-first-zones.pl
    * Creates static zone-files (tgname, infra, ipv6zone)
  * bootstrap/make-reverse4-files.pl
    * Creates reverse-zones for IPv4
  * bootstrap/make-dhcpd.pl
    * Sets up the base setup for DHCP4
  * bootstrap/make-dhcpd6.pl
    * Sets up the base setup for DHCP6

3++: Update during the party using update-baseservice.sh from bootstrap
------------------------------------------------------------------

After 'bootstrap/make-base-requires.sh' has been run, further updating should be
managed by the following three files:
  * bootstrap/update-baseservice.sh
    * Used to add/update bind and DHCP configuration
  * bootstrap/apply-baseupdate.sh
    * Used to reload bind and restart DHCP
  * bootstrap/update-tools.sh
    * Used to push changes to the tgmanage toolchain

This means, after the base setup is completed, updating and managing the
configuration is done by updating netlist.txt and running bootstrap/update-baseservice.sh
from the bootstrap box, or from the NMS box if the toolchain gets moved there during
the party. 

To create a new DHCP scope, add DNS forward and reverse zone for a new network:

  * Add the network to netlist.txt
  * Run bootstrap/update-baseservice.sh to generate new .conf and .zone files
  * Run bootstrap/apply-baseupdate.sh to load new configuration

To do changes to DHCP config after the scope .conf file has been created 
(read: later in the party), log in to the primary/dhcp server, and make 
the changes in the appropriate .conf file ..

To do DNS changes to the main DNS zone or the infra-zone, make the changes
in the appropriate zone file on the primary DNS server.

To add DNS records to any other DNS zone (forward or reverse), you have
to use 'nsupdate'. To simplify the process, use tools/generate-dnsrr.pl
Usage on this tool is documented in the "header" of the script...


The update prosess is handled by a bunch of "sub-tools", these should typically
not need to be run individually:
  * bootstrap/make-bind-include.pl
    * Run via update-baseservice, adds new net's to DNS include
  * bootstrap/make-dhcpd-include.pl
    * Run via update-baseservice, adds new net's to DHCP include
  * bootstrap/make-missing-conf.pl
    * Run via update-baseservice, adds missing net-conf to BIND/DHCP


7: Generation of linknet dns content
------------------------------------------------------------------

Format for linknet.txt is documented in make-linknet-hosts.pl

Generate IPv4 infra hostnames and IP address assignments
by using tools/generate-dnsrr.pl

Output from this shuld go in infra.tgXX.gathering.org.zone on primary:
> cat linknet.txt | tools/make-linknet-hosts.pl | tools/generate-dnsrr.pl --domain infra.tgXX.gathering.org 

Output from this should go as input to nsupdate, see doc in generate-dnsrr.pl:
> cat linknet.txt | tools/make-linknet-hosts.pl | tools/generate-dnsrr.pl --domain infra.tgXX.gathering.org -ns -rev
