const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const gtts = require('gtts');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'phx-docs', 'screenshots');
const OUTPUT_DIR = path.join(__dirname, '..', 'phx-docs', 'pdf');
const TEMP_DIR = '/tmp/narrated-video2';

fs.mkdirSync(TEMP_DIR, { recursive: true });

const slides = [
  {
    image: null,
    title: 'PHX EXCHANGE',
    narration: 'PHX Exchange. A digital marketplace built for the Ministry of Hajj and Umrah. This demonstration shows how the platform brings transparency, compliance, and financial oversight to the entire Hajj accommodation supply chain.',
    type: 'intro'
  },
  {
    image: '01_login_page.png',
    title: 'Secure Login Portal',
    narration: 'Every participant in the Hajj accommodation market — hotels, brokers, agents, and Ministry administrators — must authenticate through a secure, role-based login. This eliminates unauthorized access and ensures only verified operators can transact.'
  },
  {
    image: '02_admin_dashboard.png',
    title: 'Ministry Admin Dashboard',
    narration: 'The Ministry Dashboard gives regulators a real-time view of the entire market. Total registered operators, active auctions, total bookings, and platform revenue — all visible at a glance. This replaces paper-based reporting with live data the Ministry can trust.'
  },
  {
    image: '03_admin_users.png',
    title: 'Operator Registry',
    narration: 'The Operator Registry solves a critical Ministry challenge: knowing who is operating in the market. Every hotel, broker, and agent must be verified before they can trade. The Ministry can suspend bad actors instantly, and impersonate any account for investigation — a powerful tool for consumer protection.'
  },
  {
    image: '04_admin_reports.png',
    title: 'Financial Intelligence',
    narration: 'Financial Intelligence gives the Ministry what it has never had before — full visibility into market economics. Total gross merchandise value, VAT collected, escrow balances, and broker margins. This data supports ZATCA compliance and enables evidence-based policy decisions for the Hajj accommodation sector.'
  },
  {
    image: '05_admin_escrow.png',
    title: 'Escrow Ledger',
    narration: 'The Escrow Ledger is the Ministry guarantee that pilgrim money is protected. Every riyal is traced through the system. The 80-20 escrow split means hotels only receive full payment after pilgrims actually check in. This eliminates the fraud and no-show disputes that have plagued the industry for years.'
  },
  {
    image: '06_auctions_overview.png',
    title: 'Live Auctions',
    narration: 'The auction system replaces backroom deals with transparent, market-driven pricing. Hotels list room blocks, brokers bid in real time. Anti-sniping protection ensures fair outcomes. For the Ministry, this means price discovery — the true market value of Hajj accommodation becomes visible for the first time.'
  },
  {
    image: '07_hotel_dashboard.png',
    title: 'Hotel Dashboard',
    narration: 'Hotels get a professional portal to manage their inventory. They can list rooms, track auction results, and confirm guest check-ins. For the Ministry, the key benefit is that hotel check-in confirmation is now digitized — triggering automatic escrow release and creating an auditable record of actual occupancy.'
  },
  {
    image: '08_hotel_auctions.png',
    title: 'Hotel Auction Management',
    narration: 'Hotels create auctions with room type, distance from Haram, floor price, and end time. This structured data gives the Ministry a standardized view of accommodation supply across Makkah and Madinah — enabling capacity planning months before Hajj season.'
  },
  {
    image: '09_broker_dashboard.png',
    title: 'Broker Dashboard',
    narration: 'Brokers — the intermediaries who have historically operated with little oversight — are now fully visible to the Ministry. Their won auctions, active inventory, and agent relationships are all tracked. No more invisible middlemen inflating prices without accountability.'
  },
  {
    image: '10_broker_inventory.png',
    title: 'Broker Inventory and Markup',
    narration: 'After winning an auction, brokers set their markup percentage transparently. A 7-day listing deadline is enforced automatically — if rooms are not listed for agents in time, they revert back to the hotel. This prevents inventory hoarding, a practice the Ministry has struggled to regulate until now.'
  },
  {
    image: '11_agent_dashboard.png',
    title: 'Agent Dashboard',
    narration: 'Travel agents — who serve pilgrims directly — get a complete business management dashboard. Bookings, pilgrim counts, storefront status, and finances in one place. For the Ministry, this means agents are accountable and every pilgrim is tracked from booking to check-in.'
  },
  {
    image: '12_agent_marketplace.png',
    title: 'Agent Marketplace',
    narration: 'Agents browse available rooms from verified brokers. Each listing shows hotel images, star ratings, distance from Haram, and VAT-inclusive pricing. For the Ministry, this marketplace ensures pilgrims get accurate information and fair, standardized pricing — no more hidden fees or misleading descriptions.'
  },
  {
    image: '13_agent_bookings.png',
    title: 'Pilgrim Management',
    narration: 'This is where pilgrim data meets Ministry requirements. Agents register pilgrims individually or via CSV bulk upload, including passport numbers and Nusuk IDs. The system syncs directly with Nusuk Masar for visa processing. This digitizes the entire pilgrim-to-Ministry data flow — replacing faxes, emails, and manual spreadsheets.'
  },
  {
    image: '14_agent_storefront.png',
    title: 'Agent Storefront',
    narration: 'Each agent can create a branded public storefront, a website pilgrims can visit to book rooms directly. For the Ministry, this is transformative. It brings the informal pilgrim booking market online, where it can be monitored, taxed, and regulated. Every booking through a storefront flows into the compliance pipeline.'
  },
  {
    image: '15_agent_transactions.png',
    title: 'Wallet and Transaction Ledger',
    narration: 'The Wallet and Transaction Ledger is a double-entry audit trail of every financial transaction. Escrow holds, releases, payouts, and platform fees — all recorded permanently. This gives the Ministry and ZATCA a complete financial record for tax compliance and anti-money-laundering oversight.'
  },
  {
    image: '16_public_storefront.png',
    title: 'Public Pilgrim Storefront',
    narration: 'Finally, the pilgrim experience. Pilgrims book through their agent branded page, as individuals, in groups, or via CSV upload. The footer confirms: Secure Booking, ZATCA Compliant, Escrow Protected. For the Ministry, this means every pilgrim accommodation is verified, funded, and traceable, before they even arrive in the Kingdom.'
  },
  {
    image: '21_agent_pending_sync_dashboard.png',
    title: 'Agent Pending Sync Notifications',
    narration: 'Agents are never left guessing. When pilgrims submit bookings through their storefront, the agent dashboard immediately shows an amber notification banner with the exact count of pilgrims awaiting Ministry submission. This same alert appears on the Bookings page. For the Ministry, this means no pilgrim booking sits idle. Agents are prompted to act, and the system tracks compliance at every step.'
  },
  {
    image: '23_pilgrim_progress_tracker.png',
    title: 'Pilgrim Visa Progress Tracker',
    narration: 'Pilgrims can check their booking status at any time without logging in. They enter their voucher ID and passport number, and a three-step progress tracker shows exactly where their application stands: Booking Received, Submitted to Ministry, and Visa Issued. Each step turns green as it completes. When the visa is approved, the pilgrim can download their official accommodation voucher as a PDF. This transparency builds trust and reduces the thousands of status inquiry calls that agents handle every Hajj season.'
  },
  {
    image: '24_public_storefront_rooms.png',
    title: 'Pilgrim Booking Confirmation',
    narration: 'After a pilgrim completes their booking, whether as an individual, a group leader, or via CSV upload, they receive a clear confirmation with their unique voucher ID. The confirmation prominently displays a link to track their visa status and download their accommodation voucher. Group leaders receive instructions explaining that each pilgrim in their group can track their own status independently. This self-service approach gives pilgrims confidence while reducing the support burden on agents.'
  },
  {
    image: null,
    title: 'PHX EXCHANGE',
    narration: 'PHX Exchange. Transparent pricing. Escrow-protected payments. Full regulatory visibility. Real-time pilgrim tracking. Built for the Ministry of Hajj and Umrah. Built for Vision 2030. Ready for deployment. Contact Amina Yussuf Mohamed, Founder and Lead Architect, for a live demonstration.',
    type: 'outro'
  }
];

function generateAudio(text, filepath) {
  return new Promise((resolve, reject) => {
    const speech = new gtts(text, 'en');
    speech.save(filepath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAudioDuration(filepath) {
  const result = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filepath}"`,
    { timeout: 10000 }
  ).toString().trim();
  return parseFloat(result);
}

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

async function main() {
  console.log('Step 1: Generating voiceover audio clips...\n');

  const audioFiles = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const audioPath = path.join(TEMP_DIR, `audio_${String(i).padStart(2, '0')}.mp3`);
    await generateAudio(slide.narration, audioPath);
    audioFiles.push(audioPath);
    console.log(`  Audio ${i + 1}/${slides.length}: ${slide.title}`);
  }

  console.log('\nStep 2: Creating video slides matched to audio duration...\n');

  const slideVideos = [];
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const audioPath = audioFiles[i];
    const duration = getAudioDuration(audioPath) + 1.5;
    const videoPath = path.join(TEMP_DIR, `video_${String(i).padStart(2, '0')}.mp4`);
    slideVideos.push(videoPath);

    const titleEsc = escapeFFmpeg(slide.title);

    if (slide.type === 'intro') {
      const filterComplex = `color=c=0x1a1a2e:s=1280x720:d=${duration},` +
        `drawtext=text='PHX EXCHANGE':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=220:enable='between(t,0.5,${duration})',` +
        `drawtext=text='Product Demonstration':fontsize=32:fontcolor=0xcccccc:x=(w-text_w)/2:y=300:enable='between(t,1,${duration})',` +
        `drawtext=text='Ministry of Hajj and Umrah':fontsize=26:fontcolor=0xddaa00:x=(w-text_w)/2:y=360:enable='between(t,1.5,${duration})',` +
        `drawtext=text='March 2026':fontsize=22:fontcolor=0x999999:x=(w-text_w)/2:y=420:enable='between(t,2,${duration})',` +
        `fade=t=in:st=0:d=1,fade=t=out:st=${(duration - 0.5).toFixed(1)}:d=0.5`;

      const cmd = `ffmpeg -y -f lavfi -i "${filterComplex}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 128k -pix_fmt yuv420p -r 24 -shortest "${videoPath}" 2>&1`;
      execSync(cmd, { timeout: 30000 });
    } else if (slide.type === 'outro') {
      const filterComplex = `color=c=0x1a1a2e:s=1280x720:d=${duration},` +
        `drawtext=text='PHX EXCHANGE':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=170:enable='between(t,0.5,${duration})',` +
        `drawtext=text='Transparent Pricing':fontsize=24:fontcolor=0x4CAF50:x=(w-text_w)/2:y=240:enable='between(t,1,${duration})',` +
        `drawtext=text='Escrow-Protected Payments':fontsize=24:fontcolor=0x4CAF50:x=(w-text_w)/2:y=275:enable='between(t,1.5,${duration})',` +
        `drawtext=text='Full Regulatory Visibility':fontsize=24:fontcolor=0x4CAF50:x=(w-text_w)/2:y=310:enable='between(t,2,${duration})',` +
        `drawtext=text='Built for Vision 2030':fontsize=26:fontcolor=0xddaa00:x=(w-text_w)/2:y=370:enable='between(t,2.5,${duration})',` +
        `drawtext=text='Amina Yussuf Mohamed':fontsize=22:fontcolor=0x999999:x=(w-text_w)/2:y=430:enable='between(t,3,${duration})',` +
        `drawtext=text='Founder and Lead Architect':fontsize=18:fontcolor=0x777777:x=(w-text_w)/2:y=460:enable='between(t,3,${duration})',` +
        `drawtext=text='Contact for Live Demonstration':fontsize=22:fontcolor=0xddaa00:x=(w-text_w)/2:y=520:enable='between(t,3.5,${duration})',` +
        `fade=t=in:st=0:d=1,fade=t=out:st=${(duration - 0.5).toFixed(1)}:d=0.5`;

      const cmd = `ffmpeg -y -f lavfi -i "${filterComplex}" -i "${audioPath}" -c:v libx264 -c:a aac -b:a 128k -pix_fmt yuv420p -r 24 -shortest "${videoPath}" 2>&1`;
      execSync(cmd, { timeout: 30000 });
    } else {
      const imagePath = path.join(SCREENSHOTS_DIR, slide.image);

      let drawtext = `drawtext=text='${titleEsc}':fontsize=34:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=20:enable='between(t,0.3,${duration})'`;

      const fade = `fade=t=in:st=0:d=0.5,fade=t=out:st=${(duration - 0.5).toFixed(1)}:d=0.5`;

      const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x1a1a2e,${drawtext},${fade}" -c:v libx264 -c:a aac -b:a 128k -pix_fmt yuv420p -r 24 -shortest "${videoPath}" 2>&1`;
      execSync(cmd, { timeout: 30000 });
    }

    console.log(`  Slide ${i + 1}/${slides.length}: ${slide.title} (${duration.toFixed(1)}s)`);
  }

  console.log('\nStep 3: Stitching final video...\n');

  const concatList = slideVideos.map(f => `file '${f}'`).join('\n');
  const concatFile = path.join(TEMP_DIR, 'concat.txt');
  fs.writeFileSync(concatFile, concatList);

  const finalOutput = path.join(OUTPUT_DIR, 'PHX_Demo_Video.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v libx264 -c:a aac -b:a 128k -pix_fmt yuv420p -r 24 "${finalOutput}" 2>&1`,
    { timeout: 120000 }
  );

  const stats = fs.statSync(finalOutput);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

  const durationResult = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${finalOutput}"`,
    { timeout: 10000 }
  ).toString().trim();
  const totalSec = Math.round(parseFloat(durationResult));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  console.log(`Done! Narrated demo video created.`);
  console.log(`  File: ${finalOutput}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`  Duration: ${mins}:${String(secs).padStart(2, '0')}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
