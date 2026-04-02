const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'phx-docs', 'screenshots');
const OUTPUT_DIR = path.join(__dirname, '..', 'phx-docs', 'pdf');
const TEMP_DIR = '/tmp/demo-video';

fs.mkdirSync(TEMP_DIR, { recursive: true });

const slides = [
  {
    image: '01_login_page.png',
    title: 'Secure Login Portal',
    subtitle: 'Role-based authentication for Hotels, Brokers, Agents, and Ministry Administrators',
    duration: 6
  },
  {
    image: '02_admin_dashboard.png',
    title: 'Ministry Admin Dashboard',
    subtitle: 'Real-time overview: Total users, active auctions, bookings, and platform revenue at a glance',
    duration: 7
  },
  {
    image: '03_admin_users.png',
    title: 'Operator Registry',
    subtitle: 'Every hotel, broker, and agent must be verified before trading. Admin can suspend or impersonate any account for investigation',
    duration: 8
  },
  {
    image: '04_admin_reports.png',
    title: 'Financial Intelligence',
    subtitle: 'Platform-wide analytics: Total GMV, VAT collected, escrow balances, and broker margins — all in real time',
    duration: 8
  },
  {
    image: '05_admin_escrow.png',
    title: 'Escrow Ledger',
    subtitle: 'Every riyal traced through the system. The 80/20 escrow split is tracked automatically — audit-ready at all times',
    duration: 8
  },
  {
    image: '06_auctions_overview.png',
    title: 'Live Auctions',
    subtitle: 'Hotels list room blocks, brokers bid in real time via WebSocket. Anti-sniping protection ensures fair market pricing',
    duration: 8
  },
  {
    image: '07_hotel_dashboard.png',
    title: 'Hotel Dashboard',
    subtitle: 'Hotels manage their listings, view auction results, and confirm guest check-ins to trigger escrow release',
    duration: 7
  },
  {
    image: '08_hotel_auctions.png',
    title: 'Hotel Auction Management',
    subtitle: 'Create room block auctions with room type, distance from Haram, floor price, and end time',
    duration: 7
  },
  {
    image: '09_broker_dashboard.png',
    title: 'Broker Dashboard',
    subtitle: 'Brokers monitor won auctions, manage active inventory, and track agent relationships',
    duration: 7
  },
  {
    image: '10_broker_inventory.png',
    title: 'Broker Inventory & Markup Control',
    subtitle: 'After winning an auction, brokers set their own markup and list rooms for agents. The 7-day listing deadline is enforced automatically',
    duration: 8
  },
  {
    image: '11_agent_dashboard.png',
    title: 'Agent Dashboard',
    subtitle: 'Agents view bookings, pilgrim counts, storefront status, and their financial summary',
    duration: 7
  },
  {
    image: '12_agent_marketplace.png',
    title: 'Agent Marketplace',
    subtitle: 'Browse available rooms from verified brokers — hotel images, star ratings, distance from Haram, and VAT-inclusive pricing',
    duration: 8
  },
  {
    image: '13_agent_bookings.png',
    title: 'Pilgrim Management',
    subtitle: 'Add pilgrims individually or via CSV bulk upload. Track Nusuk sync status and download booking voucher PDFs',
    duration: 8
  },
  {
    image: '14_agent_storefront.png',
    title: 'Agent Storefront Setup',
    subtitle: 'Agents create their own branded public storefront. Set commission rates, customize branding, and share a URL with pilgrims worldwide',
    duration: 8
  },
  {
    image: '15_agent_transactions.png',
    title: 'Wallet & Transaction Ledger',
    subtitle: 'Double-entry audit trail of every transaction: escrow holds, releases, payouts, and platform fees',
    duration: 8
  },
  {
    image: '16_public_storefront.png',
    title: 'Public Pilgrim Storefront',
    subtitle: 'The pilgrim-facing page. Book directly through an agent storefront — individual, group, or CSV upload. ZATCA Compliant. Escrow Protected.',
    duration: 8
  }
];

function escapeFFmpeg(text) {
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "\\\\'")
    .replace(/:/g, '\\\\:')
    .replace(/,/g, '\\\\,')
    .replace(/\[/g, '\\\\[')
    .replace(/\]/g, '\\\\]')
    .replace(/;/g, '\\\\;');
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

console.log('Creating demo video slides...\n');

// Step 1: Create individual slide videos with text overlay
const slideFiles = [];

for (let i = 0; i < slides.length; i++) {
  const slide = slides[i];
  const inputPath = path.join(SCREENSHOTS_DIR, slide.image);
  const outputPath = path.join(TEMP_DIR, `slide_${String(i).padStart(2, '0')}.mp4`);
  slideFiles.push(outputPath);

  const titleEsc = escapeFFmpeg(slide.title);
  const subtitleLines = wrapText(slide.subtitle, 80);

  let drawtext = `drawtext=text='${titleEsc}':fontsize=36:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=30:enable='between(t,0.5,${slide.duration})'`;

  for (let j = 0; j < subtitleLines.length; j++) {
    const lineEsc = escapeFFmpeg(subtitleLines[j]);
    const yPos = 580 + (j * 28);
    drawtext += `,drawtext=text='${lineEsc}':fontsize=20:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=${yPos}:enable='between(t,0.5,${slide.duration})'`;
  }

  // Add fade in/out
  const fadeFilter = `fade=t=in:st=0:d=0.5,fade=t=out:st=${slide.duration - 0.5}:d=0.5`;

  const cmd = `ffmpeg -y -loop 1 -i "${inputPath}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x1a1a2e,${drawtext},${fadeFilter}" -c:v libx264 -t ${slide.duration} -pix_fmt yuv420p -r 24 "${outputPath}" 2>&1`;

  try {
    execSync(cmd, { timeout: 30000 });
    console.log(`  Slide ${i + 1}/${slides.length}: ${slide.title}`);
  } catch (err) {
    console.error(`  ERROR on slide ${i + 1}: ${err.message.substring(0, 200)}`);
  }
}

// Step 2: Create intro slide
const introPath = path.join(TEMP_DIR, 'intro.mp4');
const introCmd = `ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1280x720:d=5" -vf "drawtext=text='PHX EXCHANGE':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=220:enable='between(t,0.5,5)',drawtext=text='Product Demonstration':fontsize=32:fontcolor=0xcccccc:x=(w-text_w)/2:y=300:enable='between(t,1,5)',drawtext=text='March 2026':fontsize=24:fontcolor=0x999999:x=(w-text_w)/2:y=360:enable='between(t,1.5,5)',fade=t=in:st=0:d=1,fade=t=out:st=4:d=1" -c:v libx264 -pix_fmt yuv420p -r 24 "${introPath}" 2>&1`;
try {
  execSync(introCmd, { timeout: 15000 });
  console.log('\n  Intro slide created');
} catch (err) {
  console.error('  ERROR on intro:', err.message.substring(0, 200));
}

// Step 3: Create outro slide
const outroPath = path.join(TEMP_DIR, 'outro.mp4');
const outroCmd = `ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1280x720:d=6" -vf "drawtext=text='PHX EXCHANGE':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=200:enable='between(t,0.5,6)',drawtext=text='Built and Ready for Deployment':fontsize=28:fontcolor=0xcccccc:x=(w-text_w)/2:y=270:enable='between(t,1,6)',drawtext=text='Amina Yussuf Mohamed':fontsize=24:fontcolor=0x999999:x=(w-text_w)/2:y=340:enable='between(t,1.5,6)',drawtext=text='Founder and Lead Architect':fontsize=20:fontcolor=0x777777:x=(w-text_w)/2:y=375:enable='between(t,1.5,6)',drawtext=text='Contact for Live Demonstration':fontsize=22:fontcolor=0xddaa00:x=(w-text_w)/2:y=440:enable='between(t,2,6)',fade=t=in:st=0:d=1,fade=t=out:st=5:d=1" -c:v libx264 -pix_fmt yuv420p -r 24 "${outroPath}" 2>&1`;
try {
  execSync(outroCmd, { timeout: 15000 });
  console.log('  Outro slide created');
} catch (err) {
  console.error('  ERROR on outro:', err.message.substring(0, 200));
}

// Step 4: Concatenate all slides
console.log('\nStitching video together...');

const concatList = [introPath, ...slideFiles, outroPath]
  .map(f => `file '${f}'`)
  .join('\n');
const concatFile = path.join(TEMP_DIR, 'concat.txt');
fs.writeFileSync(concatFile, concatList);

const finalOutput = path.join(OUTPUT_DIR, 'PHX_Demo_Video.mp4');
const concatCmd = `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -pix_fmt yuv420p -r 24 "${finalOutput}" 2>&1`;

try {
  execSync(concatCmd, { timeout: 60000 });
  const stats = fs.statSync(finalOutput);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`\nDemo video created: ${finalOutput}`);
  console.log(`Size: ${sizeMB} MB`);
  
  const totalDuration = 5 + slides.reduce((sum, s) => sum + s.duration, 0) + 6;
  console.log(`Duration: ~${Math.floor(totalDuration / 60)}:${String(totalDuration % 60).padStart(2, '0')}`);
} catch (err) {
  console.error('ERROR stitching:', err.message.substring(0, 300));
}
