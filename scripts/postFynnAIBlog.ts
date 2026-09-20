import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync('./firebase-service-account.json', 'utf8')
);

const FIREBASE_BUCKET = process.env.VITE_FIREBASE_STORAGE_BUCKET || 'timco-7f829.firebasestorage.app';

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: FIREBASE_BUCKET
    });
}

const db = getFirestore(admin.app(), 'main');
const bucket = admin.storage().bucket();

const imageFiles = {
    portal: '/Users/timothyco/.gemini/antigravity/brain/a4e35c04-5cd3-4c83-b492-26eb508884ac/.user_uploaded/media_1788581442352.png',
    macro: '/Users/timothyco/.gemini/antigravity/brain/a4e35c04-5cd3-4c83-b492-26eb508884ac/.user_uploaded/media_1788581442346.png',
    fundamentals: '/Users/timothyco/.gemini/antigravity/brain/a4e35c04-5cd3-4c83-b492-26eb508884ac/.user_uploaded/media_1788581442361.png',
    technicals: '/Users/timothyco/.gemini/antigravity/brain/a4e35c04-5cd3-4c83-b492-26eb508884ac/.user_uploaded/media_1788581442357.png'
};

async function uploadImage(localPath: string, baseName: string): Promise<string> {
    const dest = `images/${Math.random()}-${baseName}.png`;
    console.log(`Uploading ${localPath} to ${dest}...`);
    await bucket.upload(localPath, {
        destination: dest,
        metadata: { contentType: 'image/png' }
    });
    try {
        await bucket.file(dest).makePublic();
    } catch (e) {
        // bucket may use uniform bucket-level access
    }
    return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodeURIComponent(dest)}?alt=media`;
}

async function updatePost() {
    console.log('--- Updating FynnAI Blog Post with Simplified Content ---');

    for (const [key, path] of Object.entries(imageFiles)) {
        if (!existsSync(path)) {
            throw new Error(`Missing image file: ${path}`);
        }
    }

    const portalUrl = await uploadImage(imageFiles.portal, 'fynn-portal-catalysts');
    const macroUrl = await uploadImage(imageFiles.macro, 'fynn-macro-yield-curve');
    const fundamentalsUrl = await uploadImage(imageFiles.fundamentals, 'fynn-asset-fundamentals-scorecard');
    const technicalsUrl = await uploadImage(imageFiles.technicals, 'fynn-asset-technicals-pre-the-move');

    const title = 'Beyond the Spreadsheets: Building My Multi-Agent Investing Hub with Antigravity';

    const section1 = `When I wrote about **[Fynn (Fundamentals You Need Now)](https://timchi.co/blog/Fynn_-_Fundamentals_You_Need_Now)** a while back, the idea was simple: I was tired of opening twenty tabs every earnings season just to pull financial statements, calculate free cash flow, and run valuation models. Fynn was an early experiment in using LLMs to pull that data automatically and cut out the manual grunt work.

Fynn handled the statement scraping well, but over time it became obvious that fundamentals are only one piece of the puzzle. You can find a great business with solid earnings, but if you buy it during an aggressive rate-hiking cycle, into a broken weekly downtrend, or at the peak of a hype cycle, you can easily get stuck in a long drawdown.

I wanted a single screen that looked at the full picture: **Macro Regimes**, **Fundamentals**, **Technicals**, and **Filtered Sentiment**. 

Instead of spending weeks setting up boilerplate backend APIs, database schemas, and wrestling with frontend state, I built this using **Antigravity and an agent orchestrator model**, where each pillar runs as its own dedicated subagent.

Here is the breakdown of how the thinking evolved, what worked, and what the setup looks like today.

---

# 1. Macro: Grounding Decisions in the Real Economy

Early on, I spent plenty of time in trading communities, chat rooms, and running small trials. The biggest takeaway from that period was simple: macro rules everything. A great company will still get crushed in a liquidity crunch, while average companies can run hard when the Fed is easing and yields are cooperating.

Instead of guessing where we are in the cycle, the **Macro Subagent** tracks raw signals directly:

* **Inflation Baselines:** Watching CPI and PCE to see if price pressures are cooling off.
* **Yield Curve & Term Structure:** Tracking whether bond spreads are flat, inverted, or steepening, and flagging multiple compression risks.
* **Monetary Policy & Labor:** Keeping tabs on Fed policy rates and job market health.
* **Economic Activity & Volatility:** Monitoring business activity indexes alongside market volatility (VIX) to measure complacency versus fear.

When the macro engine reads an expansive or disinflationary environment, the orchestrator sets a constructive capital posture—giving a clear green light to deploy cash into high-quality names on pullbacks while maintaining a safe cash buffer.`;

    const section2 = `# 2. Fundamentals: Numbers Beat Price Action Every Time

My background is in math and finance, and over a multi-year horizon, underlying business numbers always beat short-term price swings. 

A lot of my foundation comes from Graham and Buffett, along with modern creators like **Joseph Carlson (JL)** and **Jeremy Lefebvre (JC)**. Their focus on free cash flow, sustainable dividend growth, capital allocation, and valuation multiples is how I anchor my thinking.

Price action can be deceiving, but cash flows are what actually drive long-term returns. In the hub, the **Fundamental Subagent** runs every stock through a straightforward check:

1. **Quant Factor Scorecards:** Evaluating composite grades across valuation multiples, revenue growth, profitability margins, momentum, and earnings revisions.
2. **Multi-Year Valuation Projections:** Modeling Bull, Base, and Bear scenarios over 1, 3, and 5-year horizons to calculate realistic price targets and expected annualized returns.
3. **Margin of Safety:** Making sure positions offer strong upside relative to risk before committing capital.

If the numbers don't work, the stock doesn't make the list.`;

    const section3 = `# 3. Technicals: Extracting the Math from Indicator Noise

Fundamentals tell you what to look at, but technicals help with timing and execution.

I spent a lot of time down the technical indicator rabbit hole—trying dozens of overlays, tweaking settings, and backtesting combinations. Eventually, I anchored on the **[Traders Helping Traders](https://capitalist-academy1.teachable.com/) (THT / 33 FVB)** framework and the **BX Trender** momentum oscillator:

* **33 FVB (Fair Value Band):** A baseline built around the 33 EMA to spot mean-reversion discount zones.
* **BX Trender (Weekly & Monthly Momentum):** A clean oscillator that measures trend momentum across higher timeframes.

After spending months tinkering with Pine Script in TradingView, I pulled out the math, translated the formulas into Python, and let the **Technical Subagent** use technicals strictly as an **execution and confluence check**:

* **Limit Buy Pockets:** High-conviction stocks resting right on top of their green baseline.
* **Genesis Entries:** Fresh baseline bounces confirmed by higher-timeframe momentum turning up.
* **Froth & Take-Profit Targets:** Overextended runs where it makes sense to trim profits and tighten stops.
* **Bull Traps:** Counter-trend bounces into falling baselines that should be avoided.`;

    const section4 = `# 4. Sentiment: Cutting Through the Noise

Social feeds on Twitter/X and Discord trading servers are mostly pure noise, emotion, and late hype. But buried in all that chatter are occasional nuggets of real signal—things like supply chain lead times, hyperscaler capex plans, or institutional rotation patterns.

Working with social data has two main problems:
* Standard APIs are either expensive, rate-limited, or strip out context.
* Manually checking feeds every day is a huge time sink.

To solve this, the **Sentiment Subagent** uses autonomous browser agents to scan curated research lists and active trade channels. It extracts key quotes, flags capex data points, and categorizes everything into dedicated catalyst streams (Macro & Inflation, Tech & Semis, AI Infrastructure, Earnings & Guidance, Liquidity & Credit)—giving me the signal without having to doomscroll.

---

# 5. AI Enablement: Moving from Monoliths to Subagents

In my day job on the coding capability team at Google DeepMind, I see how fast software development is shifting. The old way of building software—writing boilerplate backend endpoints, defining rigid schemas, wiring up state management, and hand-coding UI components—takes way too long for personal tooling.

With **Antigravity**, I structured this as an **Agent Orchestrator**:

1. **Dedicated Subagents:** Instead of building a giant monolithic backend, individual subagents run calculations in parallel. One handles macro data and Treasury yield spreads, one calculates multi-year valuation models and quant scores, one runs technical baseline math, and one parses live market catalysts.
2. **Orchestrator Synthesis:** The main orchestrator takes the outputs from all subagents, evaluates the confluence, and assigns actionable trade ratings and portfolio directives.
3. **Prompt-Driven UI:** The entire interface—including the telemetry cards, execution ladders, and deep inspector views—was generated directly from structural prompts and iterated on the fly.

If I want to change a calculation or add a new data source, I just tweak that specific subagent without touching the rest of the app.

---

# 6. Dashboard Walkthrough

Here is a simplified look at the main features across each screen of the dashboard:

### 1. The Portal & Real-Time Catalyst Feed
The main portal is the command deck, giving an immediate pulse on overall market conditions and incoming news.

* **Macro Regime & Sentiment Gauge:** Displays the active economic regime, a Fear & Greed sentiment gauge, and the current market volatility state at a glance.
* **Capital Allocation Directive:** Issues clear portfolio guidelines, telling you whether to selectively accumulate leaders into discount pockets or hold a defensive cash buffer.
* **Market Catalyst Stream:** A live feed that automatically classifies incoming economic reports, cloud capex announcements, and earnings news, tagging each item directly to the stocks and metrics it affects.

---

### 2. Macro Regime & Treasury Yield Curve
The macro tab breaks down systemic economic indicators and fixed-income trends.

* **Macro Benchmark Tracker:** Evaluates key readings—including inflation, Fed interest rates, unemployment, and economic activity—against standard historical threshold ranges to confirm whether the economy is expanding, neutral, or tightening.
* **Yield Curve & Valuation Impact:** Visualizes the Treasury yield curve across short, medium, and long maturities, highlighting term premium trends and flagging when rising yields might create valuation pressure on growth stocks.

---

### 3. Asset Matrix: Fundamentals & Multi-Year Valuation
Clicking any company in the master matrix opens a deep-dive fundamentals inspector.

* **Quant Scorecard:** Summarizes the stock's profile into clear letter grades for valuation multiples, growth rates, profitability margins, momentum, and earnings revisions.
* **Multi-Year Valuation Scenarios:** Projects revenue growth, operating margins, and price targets across Bull, Base, and Bear scenarios over 1-year, 3-year, and 5-year horizons.
* **Master Intelligence Matrix:** A centralized, sortable table that tracks current prices, entry signals, technical status, and quant scores for every stock on the watchlist.

---

### 4. Asset Matrix: Technicals & Execution Planning
The technical tab takes away the guesswork by turning price action into structured execution levels.

* **Multi-Timeframe Trend Chart:** Combines the daily baseline with weekly and monthly momentum bars to show whether a trend is healthy or losing steam.
* **Pre-the-Move Execution Ladder:** Lays out clear price zones ahead of time, showing optimal limit buy pockets, stop-loss invalidation levels, and phased profit-taking targets.
* **Mean Reversion Checks:** Measures how far a stock has stretched above its daily, weekly, and monthly averages, providing clear directives on whether to buy pullbacks or avoid chasing overextended moves.

---

# Final Thoughts

Going from manual spreadsheets and standalone Python notebooks to a multi-agent system reinforced a simple rule: **good investing isn't about predicting what happens next; it's about having a clear, unemotional process**.

By combining macro awareness, fundamental valuations, technical confluence, and AI subagents to do the legwork, you take out the emotional urge to buy the top or panic at the bottom.

Tools like Antigravity make building personalized, production-grade tools faster than ever. You don't have to spend weeks writing boilerplate—you just need a clear idea of how you want your system to work.`;

    const content = `${section1}

//=//=//=//

${section2}

//=//=//=//

${section3}

//=//=//=//

${section4}`;

    const postDoc = {
        title,
        content,
        category: 'growth',
        draft: false,
        archive: false,
        thumbnail: portalUrl,
        albums: [
            {
                photos: [macroUrl]
            },
            {
                photos: [fundamentalsUrl]
            },
            {
                photos: [technicalsUrl]
            },
            {
                photos: [portalUrl]
            }
        ],
        created_at: new Date().toISOString()
    };

    // Find next ID or update if exists
    const snap = await db.collection('blog').get();
    let maxId = 0;
    let existingId: string | null = null;
    snap.forEach(doc => {
        const num = parseInt(doc.id, 10);
        if (!isNaN(num) && num > maxId) {
            maxId = num;
        }
        if (doc.data().title === title) {
            existingId = doc.id;
        }
    });

    const targetId = existingId || (maxId + 1).toString();
    console.log(`Assigning Document ID: ${targetId} (existing: ${!!existingId})`);

    await db.collection('blog').doc(targetId).set(postDoc);
    console.log(`✓ Post updated successfully with ID: ${targetId}`);
}

updatePost().catch(console.error);
