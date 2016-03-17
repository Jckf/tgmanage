--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: comment_state; Type: TYPE; Schema: public; Owner: nms
--

CREATE TYPE comment_state AS ENUM (
    'active',
    'inactive',
    'persist',
    'delete'
);


ALTER TYPE comment_state OWNER TO nms;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: dhcp; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE dhcp (
    switch integer,
    "time" timestamp without time zone,
    mac macaddr
);


ALTER TABLE dhcp OWNER TO postgres;

--
-- Name: linknet_ping; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE linknet_ping (
    linknet integer NOT NULL,
    "time" timestamp with time zone DEFAULT now() NOT NULL,
    latency1_ms double precision,
    latency2_ms double precision
);


ALTER TABLE linknet_ping OWNER TO nms;

--
-- Name: linknets; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE linknets (
    linknet integer NOT NULL,
    switch1 integer NOT NULL,
    addr1 inet NOT NULL,
    switch2 integer NOT NULL,
    addr2 inet NOT NULL
);


ALTER TABLE linknets OWNER TO nms;

--
-- Name: linknets_linknet_seq; Type: SEQUENCE; Schema: public; Owner: nms
--

CREATE SEQUENCE linknets_linknet_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE linknets_linknet_seq OWNER TO nms;

--
-- Name: linknets_linknet_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nms
--

ALTER SEQUENCE linknets_linknet_seq OWNED BY linknets.linknet;


--
-- Name: ping; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE ping (
    switch integer NOT NULL,
    "time" timestamp with time zone DEFAULT now() NOT NULL,
    latency_ms double precision
);


ALTER TABLE ping OWNER TO nms;

--
-- Name: ping_secondary_ip; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE ping_secondary_ip (
    switch integer NOT NULL,
    "time" timestamp with time zone DEFAULT now() NOT NULL,
    latency_ms double precision
);


ALTER TABLE ping_secondary_ip OWNER TO nms;

--
-- Name: polls; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE polls (
    switch integer NOT NULL,
    "time" timestamp with time zone NOT NULL,
    ifname character varying(30) NOT NULL,
    ifhighspeed integer,
    ifhcoutoctets bigint,
    ifhcinoctets bigint
);


ALTER TABLE polls OWNER TO nms;

--
-- Name: seen_mac; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE seen_mac (
    mac macaddr NOT NULL,
    address inet NOT NULL,
    seen timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE seen_mac OWNER TO nms;

--
-- Name: snmp; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE snmp (
    "time" timestamp without time zone DEFAULT now() NOT NULL,
    switch integer NOT NULL,
    data jsonb,
    id integer NOT NULL
);


ALTER TABLE snmp OWNER TO nms;

--
-- Name: snmp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE snmp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE snmp_id_seq OWNER TO nms;

--
-- Name: snmp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE snmp_id_seq OWNED BY snmp.id;


--
-- Name: switch_comments; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE switch_comments (
    switch integer NOT NULL,
    "time" timestamp with time zone,
    comment text,
    state comment_state DEFAULT 'active'::comment_state,
    username character varying(32),
    id integer NOT NULL
);


ALTER TABLE switch_comments OWNER TO nms;

--
-- Name: switch_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: nms
--

CREATE SEQUENCE switch_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE switch_comments_id_seq OWNER TO nms;

--
-- Name: switch_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nms
--

ALTER SEQUENCE switch_comments_id_seq OWNED BY switch_comments.id;


--
-- Name: switch_temp; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE switch_temp (
    switch integer,
    temp integer,
    "time" timestamp with time zone
);


ALTER TABLE switch_temp OWNER TO nms;

--
-- Name: switches; Type: TABLE; Schema: public; Owner: nms; Tablespace: 
--

CREATE TABLE switches (
    switch integer DEFAULT nextval(('"switches_switch_seq"'::text)::regclass) NOT NULL,
    ip inet,
    sysname character varying NOT NULL,
    switchtype character varying DEFAULT 'ex2200'::character varying NOT NULL,
    last_updated timestamp with time zone,
    locked boolean DEFAULT false NOT NULL,
    poll_frequency interval DEFAULT '00:01:00'::interval NOT NULL,
    community character varying DEFAULT 'public'::character varying NOT NULL,
    lldp_chassis_id character varying,
    secondary_ip inet,
    placement box,
    subnet4 cidr,
    subnet6 cidr,
    distro character varying
);


ALTER TABLE switches OWNER TO nms;

--
-- Name: switches_switch_seq; Type: SEQUENCE; Schema: public; Owner: nms
--

CREATE SEQUENCE switches_switch_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE switches_switch_seq OWNER TO nms;

--
-- Name: linknet; Type: DEFAULT; Schema: public; Owner: nms
--

ALTER TABLE ONLY linknets ALTER COLUMN linknet SET DEFAULT nextval('linknets_linknet_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY snmp ALTER COLUMN id SET DEFAULT nextval('snmp_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: nms
--

ALTER TABLE ONLY switch_comments ALTER COLUMN id SET DEFAULT nextval('switch_comments_id_seq'::regclass);


--
-- Name: polls_time_switch_ifname_key; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY polls
    ADD CONSTRAINT polls_time_switch_ifname_key UNIQUE ("time", switch, ifname);


--
-- Name: seen_mac_pkey; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY seen_mac
    ADD CONSTRAINT seen_mac_pkey PRIMARY KEY (mac, address, seen);


--
-- Name: switch_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY switch_comments
    ADD CONSTRAINT switch_comments_pkey PRIMARY KEY (id);


--
-- Name: switches_pkey; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY switches
    ADD CONSTRAINT switches_pkey PRIMARY KEY (switch);


--
-- Name: switches_sysname_key; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY switches
    ADD CONSTRAINT switches_sysname_key UNIQUE (sysname);


--
-- Name: switches_sysname_key1; Type: CONSTRAINT; Schema: public; Owner: nms; Tablespace: 
--

ALTER TABLE ONLY switches
    ADD CONSTRAINT switches_sysname_key1 UNIQUE (sysname);


--
-- Name: dhcp_switch; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX dhcp_switch ON dhcp USING btree (switch);


--
-- Name: dhcp_time; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX dhcp_time ON dhcp USING btree ("time");


--
-- Name: ping_index; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX ping_index ON ping USING btree ("time");


--
-- Name: polls_ifname; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX polls_ifname ON polls USING btree (ifname);


--
-- Name: polls_switch; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX polls_switch ON polls USING btree (switch);


--
-- Name: polls_switch_ifname; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX polls_switch_ifname ON polls USING btree (switch, ifname);


--
-- Name: polls_time; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX polls_time ON polls USING btree ("time");


--
-- Name: seen_mac_addr_family; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX seen_mac_addr_family ON seen_mac USING btree (family(address));


--
-- Name: seen_mac_seen; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX seen_mac_seen ON seen_mac USING btree (seen);


--
-- Name: snmp_time; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX snmp_time ON snmp USING btree ("time");


--
-- Name: snmp_time15; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX snmp_time15 ON snmp USING btree (id, switch);


--
-- Name: snmp_time6; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX snmp_time6 ON snmp USING btree ("time" DESC, switch);


--
-- Name: switch_temp_index; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX switch_temp_index ON switch_temp USING btree (switch);


--
-- Name: switches_switch; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX switches_switch ON switches USING hash (switch);


--
-- Name: updated_index2; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX updated_index2 ON linknet_ping USING btree ("time");


--
-- Name: updated_index3; Type: INDEX; Schema: public; Owner: nms; Tablespace: 
--

CREATE INDEX updated_index3 ON ping_secondary_ip USING btree ("time");


--
-- Name: dhcp_switch_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY dhcp
    ADD CONSTRAINT dhcp_switch_fkey FOREIGN KEY (switch) REFERENCES switches(switch);


--
-- Name: snmp_switch_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY snmp
    ADD CONSTRAINT snmp_switch_fkey FOREIGN KEY (switch) REFERENCES switches(switch);


--
-- Name: switchname; Type: FK CONSTRAINT; Schema: public; Owner: nms
--

ALTER TABLE ONLY polls
    ADD CONSTRAINT switchname FOREIGN KEY (switch) REFERENCES switches(switch);


--
-- Name: switchname; Type: FK CONSTRAINT; Schema: public; Owner: nms
--

ALTER TABLE ONLY ping
    ADD CONSTRAINT switchname FOREIGN KEY (switch) REFERENCES switches(switch);


--
-- Name: switchname; Type: FK CONSTRAINT; Schema: public; Owner: nms
--

ALTER TABLE ONLY switch_comments
    ADD CONSTRAINT switchname FOREIGN KEY (switch) REFERENCES switches(switch);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: seen_mac; Type: ACL; Schema: public; Owner: nms
--

REVOKE ALL ON TABLE seen_mac FROM PUBLIC;
REVOKE ALL ON TABLE seen_mac FROM nms;
GRANT ALL ON TABLE seen_mac TO nms;


--
-- Name: snmp; Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON TABLE snmp FROM PUBLIC;
REVOKE ALL ON TABLE snmp FROM postgres;
GRANT ALL ON TABLE snmp TO postgres;
GRANT ALL ON TABLE snmp TO nms;


--
-- Name: snmp_id_seq; Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON SEQUENCE snmp_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE snmp_id_seq FROM postgres;
GRANT ALL ON SEQUENCE snmp_id_seq TO postgres;
GRANT ALL ON SEQUENCE snmp_id_seq TO nms;


--
-- Name: switches; Type: ACL; Schema: public; Owner: nms
--

REVOKE ALL ON TABLE switches FROM PUBLIC;
REVOKE ALL ON TABLE switches FROM nms;
GRANT ALL ON TABLE switches TO nms;


--
-- PostgreSQL database dump complete
--

