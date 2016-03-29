#!/usr/bin/perl -I /root/tgmanage/web/stream.gathering.org/streamlib/
use warnings;
use strict;
use CGI;
# apt-get install libgeo-ip-perl
use Geo::IP;
use NetAddr::IP;
use Net::IP;
# apt-get install libnet-ip-perl libnetaddr-ip-perl 
use HTML::Template;
# apt-get install libhtml-template-perl
use stream;
use stream::config;
#use MIME::Base64;
use URI::Escape;

my $client = CGI->new;

my $v4net = $stream::config::v4net;
my $v6net = $stream::config::v6net;
my $tg = $stream::config::tg;
my $tg_full = $stream::config::tg_full;
my $video_url_mp4;
my $video_url = $stream::config::video_url;
my $video_url_fallback = $stream::config::video_url_fallback;
if($stream::config::video_url_mp4) {
$video_url_mp4 = $stream::config::video_url_mp4;
}
my %streams = %stream::config::streams;

my $force_unicast = $client->param('forceunicast');
my $no_header = $client->param('noheader');

my $location = undef;

print $client->header();

my $clip = $client->remote_addr();
my $template = HTML::Template->new(filename => 'embed.tmpl');
my $is_local = &is_ip_local($clip, $v4net, $v6net);

#my @streams = &loop_webcams("event");
#my @camstreams = &loop_webcams("camera");

my %input;
for my $key ( $client->param() ) {
	$input{$key} = $client->param($key);
}

#$template->param(TG => $tg);
$template->param(TG_FULL => $tg_full);
#$template->param(STREAMS => \@streams);
#$template->param(CAMSTREAMS => \@camstreams);
$template->param(NOHEADER => $no_header);
if(exists $input{url}) {
	my $url = uri_unescape($input{url});

	if ($url ~~ %streams) {
		$template->param(VIDEO_URL_MAIN => $streams{$url}->{main_url});
		$template->param(VIDEO_URL_FALLBACK => $streams{$url}->{fallback_url});
		if($streams{$url}->{mp4_url}) {
		$template->param(VIDEO_URL_MP4 => $streams{$url}->{mp4_url});
		}
	}
	# Check against XS-scripting:
	#if (index($decodedUrl, 'cubemap.tg16.gathering.org/') != -1) {
	#	$template->param(VIDEO_URL => $decodedUrl);
	#} elsif (index($decodedUrl, 'stream.tg16.gathering.org/') != -1) {
	#	$template->param(VIDEO_URL => $decodedUrl);
	#} else {
	#	$template->param(VIDEO_URL => $video_url);
	#}
} else {
	$template->param(VIDEO_URL_MAIN => $video_url);
	$template->param(VIDEO_URL_FALLBACK => $video_url_fallback);
        if($video_url_mp4) {
        $template->param(VIDEO_URL_MP4 => $video_url_mp4);
        }
}
print $template->output();


sub loop_webcams() {
	my @s = ();
	foreach my $name (sort { $streams{$a}->{priority} <=> $streams{$b}->{priority} } keys %streams) {
		if ($streams{$name}->{type} eq $_[0] && $streams{$name}->{online}) {
			my $vlc_url = "http://stream.tg$tg.gathering.org/generate_vlc.pl?delivery=%s&stream=${name}&interlaced=%s";
			my $multicast = $streams{$name}->{has_multicast} ? "multicast" : "unicast";
			$multicast = "unicast" if (defined $force_unicast && $force_unicast == 1 || not $is_local);

			my $vlc_link = sprintf($vlc_url, $multicast, $streams{$name}->{interlaced});
			my $href_link = '<a class="stream-link-content" href="#" onclick="swapVideo(\'' . $name . '\');">';

			my %hash = (
				'href' => $href_link,
				'title' => $streams{$name}->{title},
				'quality' => $streams{$name}->{quality},
				'type' => $streams{$name}->{type},
				'vlc_link' => $vlc_link,
			);
			push(@s, \%hash);
		}
	}
	return @s;
}
