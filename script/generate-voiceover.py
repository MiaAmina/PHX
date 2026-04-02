import os
from gtts import gTTS

OUTPUT_DIR = "/tmp/demo-audio"
os.makedirs(OUTPUT_DIR, exist_ok=True)

slides = [
    {
        "name": "intro",
        "text": "PHX Exchange. Product Demonstration. March 2026."
    },
    {
        "name": "slide_00",
        "text": "This is the secure login portal. PHX Exchange uses role-based authentication, giving Hotels, Brokers, Agents, and Ministry Administrators each their own customized experience."
    },
    {
        "name": "slide_01",
        "text": "Here is the Ministry Admin Dashboard. At a glance, administrators can see total registered users, active auctions, total bookings, and platform revenue — all updated in real time."
    },
    {
        "name": "slide_02",
        "text": "The Operator Registry shows every hotel, broker, and agent on the platform. Every operator must be verified before they can trade. Administrators can suspend accounts or impersonate any user for investigation."
    },
    {
        "name": "slide_03",
        "text": "Financial Intelligence gives platform-wide analytics. Total gross merchandise value, VAT collected, escrow balances, and broker margins are all available in real time."
    },
    {
        "name": "slide_04",
        "text": "The Escrow Ledger tracks every riyal flowing through the system. The 80-20 escrow split is enforced automatically. This ledger is audit-ready at all times."
    },
    {
        "name": "slide_05",
        "text": "Live Auctions are the heart of the marketplace. Hotels list room blocks, and brokers bid in real time using WebSocket technology. Anti-sniping protection ensures fair market pricing for everyone."
    },
    {
        "name": "slide_06",
        "text": "The Hotel Dashboard lets hotels manage their listings, view auction results, and confirm guest check-ins, which triggers the escrow release."
    },
    {
        "name": "slide_07",
        "text": "Hotels create room block auctions by specifying room type, distance from Haram, a floor price, and an end time. The platform handles the rest."
    },
    {
        "name": "slide_08",
        "text": "The Broker Dashboard provides brokers with a complete view of their won auctions, active inventory, and agent relationships."
    },
    {
        "name": "slide_09",
        "text": "After winning an auction, brokers set their markup percentage and list rooms for agents. A 7-day listing deadline is enforced automatically. If rooms aren't listed, they revert back to the hotel."
    },
    {
        "name": "slide_10",
        "text": "The Agent Dashboard shows bookings, pilgrim counts, storefront status, and a financial summary — everything an agent needs to manage their business."
    },
    {
        "name": "slide_11",
        "text": "In the Agent Marketplace, agents browse available rooms from verified brokers. Each listing shows hotel images, star ratings, distance from Haram, and VAT-inclusive pricing. Booking is just one click away."
    },
    {
        "name": "slide_12",
        "text": "Pilgrim Management lets agents add pilgrims individually or through CSV bulk upload. They can track Nusuk sync status and download official booking voucher PDFs."
    },
    {
        "name": "slide_13",
        "text": "Agent Storefront Setup allows each agent to create their own branded public storefront. They set commission rates, customize their branding, and share a unique URL with pilgrims worldwide."
    },
    {
        "name": "slide_14",
        "text": "The Wallet and Transaction Ledger provides a double-entry audit trail of every financial transaction — escrow holds, releases, payouts, and platform fees — complete transparency."
    },
    {
        "name": "slide_15",
        "text": "Finally, the Public Pilgrim Storefront. This is what pilgrims see. They book directly through their agent's branded page — as individuals, in groups, or via CSV upload. The footer confirms: Secure Booking, ZATCA Compliant, Escrow Protected."
    },
    {
        "name": "outro",
        "text": "PHX Exchange. Built and ready for deployment. For a live demonstration, contact Amina Yussuf Mohamed, Founder and Lead Architect."
    }
]

for i, slide in enumerate(slides):
    print(f"  Generating audio {i+1}/{len(slides)}: {slide['name']}")
    tts = gTTS(text=slide["text"], lang="en", slow=False)
    mp3_path = os.path.join(OUTPUT_DIR, f"{slide['name']}.mp3")
    tts.save(mp3_path)

print(f"\nAll {len(slides)} audio clips saved to {OUTPUT_DIR}")
