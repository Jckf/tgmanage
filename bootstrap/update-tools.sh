#!/bin/bash

set -e

source include/tgmanage.cfg.sh
if [ -z ${PRIMARY} ]
then
	echo "Not configured!";
	exit 1;
fi;

cd ~/tgmanage

ssh -l root ${PRIMARY} "mkdir -p ~/tgmanage"
ssh -l root ${SECONDARY} "mkdir -p ~/tgmanage"

scp -r bootstrap root@${PRIMARY}:tgmanage/
scp -r bootstrap root@${SECONDARY}:tgmanage/
scp -r include root@${PRIMARY}:tgmanage/
scp -r include root@${SECONDARY}:tgmanage/
scp -r clients root@${PRIMARY}:tgmanage/
scp -r clients root@${SECONDARY}:tgmanage/

# use last years example files
export TGNAME
last_year=`perl -e '($y)=($ENV{TGNAME} =~ m/^tg(\d\d)$/); $y--; print "tg$y"'`
scp -r examples/$last_year/pxe root@${SECONDARY}:tgmanage/
