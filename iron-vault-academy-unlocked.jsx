"use client";

/**
 * iron-vault-academy-unlocked.jsx
 *
 * UNLOCKED VARIANT — for existing investors / members.
 * - No payment check. No redirect to /learn/pay.
 * - All 6 modules accessible immediately after Privy login.
 * - Module sequencing still enforced (must pass quiz to unlock next module).
 * - Usage: drop this file at the root, then update app/learn/page.tsx to import
 *   IronVaultAcademyUnlocked from "@/iron-vault-academy-unlocked"
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');`;

const FREE_MODULE_0 = {
  id: 0,
  free: true,
  title: "Iron Vault Orientation",
  subtitle: "Complete this free lesson to qualify for a presale follow-up",
  icon: "🔓",
  tag: "FREE ACCESS",
  duration: "10-15 min",
  xpReward: 250,
  lessons: [
    {
      title: "Why We Teach First - And What That Gets You",
      content: [
        { type: "quote", text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
        { type: "heading", text: "This is not a typical crypto presale" },
        { type: "body", text: "Most presale projects ask you to send money first and understand later. Iron Vault inverts that. We believe the people who understand what they are participating in make better long-term community members than those who buy on hype and panic-sell at the first dip. So we built the education first. Complete it, pass the quiz, and your orientation submission is recorded before you spend a dollar." },
        { type: "callout", text: "Completing this orientation and passing the quiz with 8/10 or higher qualifies you for a presale follow-up at $0.001 per token. A representative from IVT MEDIA GROUP may follow up to confirm next steps. This is not a guarantee of returns - it is education-first access to discuss participation at the earliest available price." },
        { type: "heading", text: "What is Iron Vault Token (IVT)?" },
        { type: "body", text: "Iron Vault Token is a Solana-based digital asset created by IVT MEDIA GROUP. It is designed as the transactional and community utility layer of a broader ecosystem that aims to acquire income-producing real-world assets, starting with commercial real estate, and connect that economic activity to token holders through a royalty structure tied to transaction volume." },
        { type: "list", items: ["Built on Solana - fast transactions, ultra-low fees, sub-second settlement", "Presale price: $0.001 per token", "Total supply at launch: 1,000,000,000 tokens", "Launch date: November 1, 2026 on multiple exchanges", "6% transaction fee - 3% to company operations, 3% to royalty holders", "Royalty positions available: 1% and 2% tiers"] },
        { type: "heading", text: "The 3-Phase Roadmap" },
        { type: "body", text: "Iron Vault operates on a disciplined three-phase model. Each phase must be earned before the next begins, not promised in advance." },
        { type: "list", items: ["Phase 1 - Community & Education: Build 10,000 informed early members. Distribute presale tokens through approved business processes. Establish liquidity and market presence. This is where you are right now.", "Phase 2 - Royalty Ecosystem & Asset Acquisition: Transaction volume generates ecosystem revenue. Funds are deployed to acquire commercial real estate assets such as shopping centers, gas stations, and franchise locations. Optional royalty positions allow holders to participate in transaction fees.", "Phase 3 - Stablecoin Launch: A sister stablecoin backed by accumulated commercial real estate assets. Early presale positions are intended to carry forward according to final business, legal, and technical requirements."] },
        { type: "vault", title: "VAULT SECRET: Why the Stablecoin Phase Changes Everything", text: "At a designed $1.00 target value backed by real assets, the stablecoin phase is the part of the roadmap that requires the most discipline. Real estate acquisition, reserve design, audits, and compliance cannot be rushed responsibly. The people who understand the full timeline are better positioned to evaluate whether the opportunity fits their own risk tolerance." },
        { type: "heading", text: "How Smart Contracts Make This Transparent" },
        { type: "body", text: "Iron Vault Token's distribution mechanism is designed around smart contracts on the Solana blockchain. When royalty-eligible transaction fees are collected, the smart contract can read token holder balances and distribute proportional shares automatically according to the final approved contract design. Every distribution should be publicly verifiable on-chain." },
        { type: "callout", text: "On-chain transparency means participants do not have to rely only on a company's word about whether blockchain activity happened. They can verify transactions on a Solana blockchain explorer. This is one of the core advantages of building financial infrastructure on a public blockchain rather than a private internal ledger." },
        { type: "heading", text: "What Royalty Participation Actually Means" },
        { type: "body", text: "Every time an Iron Vault Token transaction occurs on any exchange, the model assesses a 6% fee. 3% funds company operations such as marketing, legal, asset acquisition, and infrastructure. The other 3% flows to royalty position holders proportionally based on their tier, subject to the final business terms." },
        { type: "list", items: ["1% Royalty Position - participates in 1% of royalty distributions", "2% Royalty Position - participates in 2% of royalty distributions", "Royalty models depend on real transaction activity, execution quality, compliance, and liquidity", "Royalty positions are intended to carry forward into the stablecoin phase under final approved terms"] },
        { type: "heading", text: "Risk Disclosure - Read This" },
        { type: "body", text: "This is a speculative early-stage digital asset. The roadmap is a plan, not a guarantee. Real estate acquisition depends on market conditions, execution quality, regulatory compliance, and capital raised. Token values can go to zero. Stablecoin launch depends on successful Phase 2 completion. There are no guaranteed returns, no guaranteed appreciation, and no government insurance on digital assets. Participate only with capital you can afford to lose entirely. This is not financial advice. Consult a qualified financial professional before making any investment decision." },
        { type: "action", text: "You now understand what Iron Vault Token is, how the royalty structure works, what the 3-phase roadmap requires, and what the risks are. Pass the quiz below with 8/10 or higher to record your orientation completion. An IVT MEDIA GROUP representative may contact you about next steps." }
      ]
    }
  ],
  quiz: [
    { q: "Iron Vault Token (IVT) is built on which blockchain?", options: ["Ethereum", "Bitcoin", "Solana", "Cardano"], correct: 2 },
    { q: "What is the Iron Vault Token presale price per token?", options: ["$0.01", "$0.001", "$1.00", "$0.0001"], correct: 1 },
    { q: "In Phase 3 of the Iron Vault roadmap, the goal is to:", options: ["Launch a new NFT collection", "List IVT on Coinbase", "Launch a stablecoin backed by acquired commercial real estate assets", "Distribute all funds to early holders and close the project"], correct: 2 },
    { q: "Of the 6% transaction fee on IVT trades, what percentage goes to royalty position holders?", options: ["6% - the entire fee", "1%", "3%", "2%"], correct: 2 },
    { q: "What is the total token supply of Iron Vault Token at launch?", options: ["100,000,000", "21,000,000", "10,000,000,000", "1,000,000,000"], correct: 3 },
    { q: "A smart contract is best described as:", options: ["A legal contract stored with a government agency", "Self-executing code on a blockchain that runs automatically when conditions are met", "An agreement between two banks to exchange digital assets", "A type of hardware wallet for storing private keys"], correct: 1 },
    { q: "DeFi stands for:", options: ["Digital Finance Initiative", "Decentralized Financial Index", "Decentralized Finance - financial services operating without traditional intermediaries", "Defined Funding Instrument"], correct: 2 },
    { q: "A token's market capitalization is calculated by:", options: ["Total tokens created divided by current price", "Current token price multiplied by circulating supply", "The amount of money raised in the presale", "Total trading volume over the last 24 hours"], correct: 1 },
    { q: "What does DYOR mean in crypto culture?", options: ["Deposit Your Own Reserves", "Do Your Own Research - verify information independently before investing", "Distribute Yield On Returns", "Dynamic Yield Optimization Ratio"], correct: 1 },
    { q: "On-chain transparency in a blockchain project means:", options: ["The company publishes quarterly reports like a public stock", "All transactions and smart contract activity are publicly verifiable on the blockchain by anyone", "Only token holders can see financial data", "Government regulators have access to all transaction records"], correct: 1 }
  ]
};

const EDUCATION_ONLY_MODULES = [
  {
    "id": 7,
    "title": "The Debt Economy",
    "subtitle": "How debt became the product — and how to make it work for you instead",
    "icon": "💳",
    "tag": "DEBT",
    "duration": "50–65 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "Debt Is Not an Accident. It's the Business Model.",
        "content": [
          {
            "type": "quote",
            "text": "There are two ways to conquer and enslave a nation. One is by the sword. The other is by debt.",
            "author": "John Adams"
          },
          {
            "type": "heading",
            "text": "The system was not designed to help you get out of debt. It was designed to keep you in it."
          },
          {
            "type": "body",
            "text": "The United States consumer debt market exceeds $17 trillion. Credit card debt alone tops $1.1 trillion. Student loan debt sits at $1.7 trillion. Medical debt is the leading cause of personal bankruptcy. These are not failures of the system. They are the system performing exactly as designed. Banks, lenders, and financial institutions are not in the business of lending money. They are in the business of collecting interest — indefinitely, from as many people as possible, for as long as possible."
          },
          {
            "type": "callout",
            "text": "The average American carries $6,000+ in credit card debt at 20–29% APR. At minimum payments, a $6,000 balance takes over 20 years to pay off and costs more than $10,000 in interest. The credit card company earns more from the interest than the original purchase was worth. You bought something once. They got paid for it twice. That math is not accidental."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Debt Trap Architecture",
            "text": "Credit card companies deliberately set minimum payments low enough to maximize interest collection without triggering default. The \"minimum payment\" is not a kindness — it's a profit optimization. They also use behavioral engineering: reward points, cashback, travel miles — all designed to increase spending and normalize carrying a balance. The rewards you earn back almost never exceed the interest you pay. The house always wins. Always."
          },
          {
            "type": "action",
            "text": "Calculate the true cost of your current debt. For every balance you carry, multiply the outstanding amount by your APR and divide by 12. That's what you're paying per month just to stand still. Write the number down. Then ask: what asset could I have bought with that money instead?\n\n\n---"
          }
        ]
      },
      {
        "title": "Good Debt vs. Bad Debt: The Distinction That Changes Everything",
        "content": [
          {
            "type": "quote",
            "text": "The rich use debt to leverage investments and grow richer. The poor and middle class use debt to buy things that make the rich richer.",
            "author": "Robert Kiyosaki"
          },
          {
            "type": "heading",
            "text": "Not all debt is the same. The wealthy borrow constantly — just never for the wrong things."
          },
          {
            "type": "body",
            "text": "Bad debt finances depreciating assets or consumption — credit cards for everyday spending, car loans on vehicles you can't afford, buy-now-pay-later on electronics, personal loans for vacations. The asset either loses value immediately or produces nothing. Good debt finances assets that generate income above the cost of borrowing. A rental property financed at 7% that generates 12% cash-on-cash return is good debt. A business loan that funds equipment generating $3 of revenue for every $1 of debt service is good debt. The question is never \"is this debt?\" The question is \"does this debt produce more than it costs?\""
          },
          {
            "type": "callout",
            "text": "The wealthy don't avoid debt — they weaponize it. Private equity firms buy entire companies using mostly borrowed money. Real estate investors use leverage to control $1 million in property with $200,000 of their own capital. When the asset appreciates, they capture 100% of the gain on an asset they only partially funded. This is called leverage, and it is the primary mechanism through which wealth is multiplied — not saved — into existence."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Debt Arbitrage Play",
            "text": "If you can borrow money at a lower interest rate than the return you can generate deploying it, borrowing is the rational move. A HELOC at 8% deployed into a rental property generating 14% net annualized return is profitable debt. The spread between the cost of capital and the return on capital is where wealth is manufactured. Banks understand this. They borrow from depositors at 0.5% and lend to borrowers at 7–25%. They've been running this arbitrage since banking was invented. You can run it too — at a smaller scale but with the same math."
          },
          {
            "type": "action",
            "text": "List every debt you currently carry. Label each: Bad Debt (financing consumption or depreciation), Good Debt (financing income-producing assets), or Neutral. If your bad debt column is the longest, that's your first target.\n\n\n---"
          }
        ]
      },
      {
        "title": "Student Loans: The $1.7 Trillion Experiment on the Middle Class",
        "content": [
          {
            "type": "heading",
            "text": "Higher education became a financial product. You were the customer and the collateral."
          },
          {
            "type": "body",
            "text": "Student loans cannot be discharged in bankruptcy. This single fact — unique among virtually all other debt instruments in the United States — tells you everything about whose interests the system was designed to protect. Lenders face zero risk. Schools face zero accountability for outcomes. Students bear 100% of the liability regardless of whether the degree produces income. This structure was not designed to democratize education. It was designed to create a captive debt market with no exit."
          },
          {
            "type": "callout",
            "text": "Between 1980 and 2020, college tuition increased over 1,200% — more than any other major expense including healthcare and housing. During the same period, median wages grew approximately 67%. The math does not work. It was never supposed to work for the borrower. It works perfectly for the lender and the institution."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Income-Driven Repayment and Forgiveness Mechanics",
            "text": "Federal student loan borrowers have access to income-driven repayment plans that cap monthly payments at 5–10% of discretionary income and forgive remaining balances after 10–25 years of payments. Public Service Loan Forgiveness (PSLF) forgives federal loans after 10 years of payments while working for qualifying employers. Most borrowers never learn these programs exist until years of unnecessary overpayment. If you have federal student loans, the IDR and PSLF pathways are legal, documented, and deliberately underadvertised because servicers earn more when you pay more."
          },
          {
            "type": "action",
            "text": "If you carry student debt, look up your loan servicer and request a full accounting: loan types, interest rates, and eligibility for income-driven repayment. Determine if any of your loans qualify for forgiveness programs. This single hour of research has the potential to restructure decades of payments.\n\n\n---"
          }
        ]
      },
      {
        "title": "Medical Debt: The Uniquely American Trap",
        "content": [
          {
            "type": "heading",
            "text": "No other developed country bankrupts its citizens for getting sick."
          },
          {
            "type": "body",
            "text": "Medical debt is the leading cause of personal bankruptcy in the United States. Over 100 million Americans carry some form of medical debt. The billed price for a medical procedure has almost no relationship to what the hospital actually accepts as payment — insurance companies negotiate discounts of 40–80% off the sticker price. But uninsured patients and those who don't negotiate are billed the full fictional rate. The entire pricing structure is designed to extract maximum payment from the least informed and most vulnerable patients."
          },
          {
            "type": "callout",
            "text": "Hospitals — including nonprofit hospitals that pay zero taxes on the grounds that they provide community benefit — routinely sue patients over unpaid bills, garnish wages, and place liens on homes. A \"nonprofit\" hospital can have a CEO earning $5 million annually while suing a cancer patient over a $3,000 bill. This is not a bug. This is American healthcare operating as designed."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Medical Debt Is Negotiable. Always.",
            "text": "Hospital bills are among the most negotiable debts in existence. Hospitals routinely accept 20–50 cents on the dollar for outstanding medical debt rather than write it off entirely. Call the billing department, not collections. Ask for the \"self-pay rate\" — many hospitals have a lower negotiated rate for uninsured patients that's never advertised. Ask about financial assistance programs (federal law requires nonprofit hospitals to have them). Get everything in writing before paying. Medical debt under $500 was removed from credit reports in 2023. Debt over $500 stays for one year before appearing. You have more leverage than they want you to know."
          },
          {
            "type": "action",
            "text": "If you have outstanding medical debt, call the billing department of the provider and ask two questions: \"What is your self-pay discount rate?\" and \"Do you have a financial assistance or charity care program?\" Write down what they say. Then negotiate.\n\n\n---"
          }
        ]
      },
      {
        "title": "Using Debt as a Tool: The Wealthy Playbook",
        "content": [
          {
            "type": "heading",
            "text": "The goal is not to be debt-free. The goal is to be strategically leveraged."
          },
          {
            "type": "body",
            "text": "Dave Ramsey tells you to cut up your credit cards. Robert Kiyosaki tells you to use them strategically. The difference is not personality — it's class. Debt freedom is the appropriate first goal for someone drowning in consumer debt. But treating all debt as the enemy permanently is a middle-class trap. The wealthy are perpetually leveraged — but against income-producing assets, not consumption."
          },
          {
            "type": "callout",
            "text": "The sequence matters: First, eliminate bad debt. Second, build a cash reserve. Third, use debt strategically to acquire assets. The people who skip steps one and two and go straight to step three get wrecked. The people who stop at step two and never move to step three leave enormous wealth on the table. Both mistakes are common. Both are expensive."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Zero-Interest Arbitrage",
            "text": "Credit cards with 0% introductory APR periods (typically 12–21 months) can be used to temporarily float cash into high-yield savings accounts or short-term investments — earning 4–5% on money that's costing you 0%. This is called a balance transfer arbitrage or float strategy. Executed correctly, with zero missed payments and full payoff before the promotional period ends, it generates risk-free yield on borrowed capital. It requires discipline, a clear payoff plan, and credit scores strong enough to access the best offers. It is a technique actively used by financially sophisticated people that banks count on most customers never figuring out."
          },
          {
            "type": "action",
            "text": "Write your debt payoff strategy in order: highest interest rate first (avalanche method — mathematically optimal) or smallest balance first (snowball method — psychologically easier). Pick one. Commit to it. Then write the date you will be consumer-debt free.\n\n\n---"
          }
        ]
      },
      {
        "title": "Building Credit as Infrastructure, Not as a Score",
        "content": [
          {
            "type": "heading",
            "text": "Your credit profile is a financial tool. Treat it like one."
          },
          {
            "type": "body",
            "text": "Most people think about credit reactively — they check their score when they need a loan and panic when it's lower than expected. Sophisticated operators build credit proactively — as infrastructure for future capital access. A strong personal credit profile is the foundation for business credit. Business credit is the foundation for entity-level financing. Entity-level financing is how you fund real estate, equipment, and operations without putting your personal assets at risk."
          },
          {
            "type": "callout",
            "text": "The five factors of your FICO score, in order of weight: Payment history (35%) — never miss a payment, ever. Credit utilization (30%) — keep balances below 10% of limits, not 30%. Length of credit history (15%) — keep old accounts open even if unused. Credit mix (10%) — having installment and revolving credit both helps. New inquiries (10%) — don't apply for multiple lines simultaneously. Understanding the engine means you can tune it intentionally."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Authorized User Trick",
            "text": "If you have a family member or trusted person with excellent credit and a long-standing account, being added as an authorized user on that account can dramatically boost your score — because their account history appears on your report. You don't need to use the card or even hold it. Their on-time payments, low utilization, and account age all transfer to your profile. This is 100% legal, commonly used by credit repair professionals, and almost never taught to the people who need it most."
          },
          {
            "type": "action",
            "text": "Pull your credit report at AnnualCreditReport.com. Identify your utilization ratio on every revolving account. If any account is above 30%, paying it down to under 10% is the single fastest legal move to improve your score.\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "The primary business model of credit card companies is:",
        "options": [
          "Providing payment convenience",
          "Collecting interest over long repayment periods",
          "Offering rewards to loyal customers",
          "Competing with banks on savings rates"
        ],
        "correct": 1
      },
      {
        "q": "\"Good debt\" is best defined as:",
        "options": [
          "Any debt with low interest",
          "Debt that finances consumption under $1,000",
          "Debt that finances assets producing more return than the cost of borrowing",
          "Debt you can discharge in bankruptcy"
        ],
        "correct": 2
      },
      {
        "q": "Student loans are unique among most U.S. debt because:",
        "options": [
          "They carry the highest interest rates",
          "They cannot be discharged in bankruptcy in most cases",
          "They are always forgiven after 10 years",
          "They are only issued by the government"
        ],
        "correct": 1
      },
      {
        "q": "The Cantillon-adjacent concept here is that minimum credit card payments are set low to:",
        "options": [
          "Help struggling borrowers stay current",
          "Maximize long-term interest collection",
          "Comply with federal consumer protection laws",
          "Reduce default rates across the portfolio"
        ],
        "correct": 1
      },
      {
        "q": "Medical debt in the U.S. is negotiable because:",
        "options": [
          "Federal law requires a 50% discount for all uninsured patients",
          "Hospitals routinely accept less than full balance rather than write it off entirely",
          "The ACA eliminated all medical debt",
          "Credit bureaus never report medical debt"
        ],
        "correct": 1
      },
      {
        "q": "Leverage in wealth-building means:",
        "options": [
          "Taking on as much debt as possible",
          "Using borrowed capital to control assets larger than your own capital base",
          "Using other people's labor to generate income",
          "Avoiding all debt until you're wealthy"
        ],
        "correct": 1
      },
      {
        "q": "The debt payoff method that is mathematically optimal is:",
        "options": [
          "Snowball — smallest balance first",
          "Random — whichever feels right",
          "Avalanche — highest interest rate first",
          "Minimum payments across all accounts"
        ],
        "correct": 2
      },
      {
        "q": "Public Service Loan Forgiveness (PSLF) forgives federal student loans after:",
        "options": [
          "25 years of any payments",
          "10 years of payments while working for qualifying employers",
          "Completing a financial literacy course",
          "Filing for bankruptcy"
        ],
        "correct": 1
      },
      {
        "q": "The authorized user credit strategy works because:",
        "options": [
          "It gives you access to the primary cardholder's spending limit",
          "The primary account's history and utilization appear on your credit report",
          "It automatically removes negative items from your report",
          "It is a government-mandated credit repair program"
        ],
        "correct": 1
      },
      {
        "q": "The zero-interest arbitrage strategy involves:",
        "options": [
          "Investing in zero-coupon bonds",
          "Placing 0% APR promotional credit card funds into yield-bearing accounts during the intro period",
          "Paying off all debt before investing anything",
          "Transferring balances between family members"
        ],
        "correct": 1
      }
    ]
  },
  {
    "id": 8,
    "title": "How Wealth Is Actually Transferred",
    "subtitle": "The generational playbook they've been running for centuries",
    "icon": "🏛",
    "tag": "LEGACY",
    "duration": "55–70 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "Why the Wealthy Don't Die Rich — They Transfer Rich",
        "content": [
          {
            "type": "quote",
            "text": "The estate tax is paid by people who are either too busy to plan or too honest not to.",
            "author": "Anonymous estate attorney"
          },
          {
            "type": "heading",
            "text": "Generational wealth is not accumulated at death. It is structured during life."
          },
          {
            "type": "body",
            "text": "The estate tax — sometimes called the \"death tax\" — applies to estates above approximately $13 million per individual as of 2024. But the ultra-wealthy rarely pay it, not because they lack assets, but because their assets are structured in ways that legally remove them from the taxable estate before death. Irrevocable trusts. Family limited partnerships. Grantor retained annuity trusts. Dynasty trusts. These are not exotic loopholes — they are standard estate planning tools used by any competent wealth management attorney. Most middle-class families have never heard of them because no one profits from teaching you about them for free."
          },
          {
            "type": "callout",
            "text": "The Walton family — heirs to the Walmart fortune — is estimated to have avoided billions in estate taxes through the use of grantor retained annuity trusts (GRATs). The Rockefellers have maintained family wealth across six generations through trust structures that were established in the early 20th century and continue operating today. Old money doesn't stay old by accident. It stays old by structure."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Annual Gift Tax Exclusion",
            "text": "Every U.S. citizen can gift up to $18,000 per year (2024 limit) to any individual without triggering gift tax or using any lifetime exemption. A couple can gift $36,000 per recipient per year. A wealthy family with five children can transfer $180,000 annually to the next generation completely tax-free — not as inheritance, but as gifts during their lifetime. Over 20 years, that's $3.6 million transferred out of the taxable estate with zero tax consequence. This is not a secret among wealthy families. It is a standard annual practice."
          },
          {
            "type": "action",
            "text": "Research your state's estate tax threshold — several states have lower thresholds than the federal $13M. If you have any assets, dependents, or wishes about what happens to your estate, write down what would happen if you died tomorrow without any planning. Then ask: is that what you want?\n\n\n---"
          }
        ]
      },
      {
        "title": "Trusts: The Wealth Protection Vehicle Most People Never Use",
        "content": [
          {
            "type": "heading",
            "text": "A trust is not just for the ultra-rich. It is for anyone who wants to control what happens to their assets."
          },
          {
            "type": "body",
            "text": "A trust is a legal arrangement where one party (the grantor) transfers assets to a trustee who manages them for the benefit of beneficiaries. Trusts come in two primary forms: revocable (you can change them during your lifetime) and irrevocable (once established, they generally cannot be altered). Revocable living trusts avoid probate — the public, expensive, time-consuming court process that distributes assets when someone dies without proper planning. Irrevocable trusts remove assets from your estate entirely, providing both tax benefits and asset protection."
          },
          {
            "type": "callout",
            "text": "Probate is a gift to lawyers, a nightmare for families, and a bill paid by the people who needed the money most. An estate worth $500,000 going through probate can take 12–24 months and cost $15,000–$50,000 in legal fees before a single dollar reaches your heirs. A revocable living trust costs $1,500–$3,000 to set up and completely bypasses probate. This is not a complicated calculation."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Dynasty Trust",
            "text": "A dynasty trust is an irrevocable trust designed to last multiple generations — in some states, indefinitely. Assets placed in a dynasty trust can grow, be invested, and distribute income to beneficiaries across generations without ever being subject to estate tax again. South Dakota, Nevada, and Delaware have the most favorable dynasty trust laws in the country — no rule against perpetuities, strong asset protection, and no state income tax on trust earnings. Wealthy families establish these trusts, fund them during their lifetime, and the compounding of those assets over generations — completely outside the estate tax system — is how billion-dollar family fortunes are maintained. The trust literally never dies."
          },
          {
            "type": "action",
            "text": "Look up the probate process in your state. Find the cost and average timeline. Then look up the cost of a revocable living trust from an estate attorney in your area. The difference will make the decision obvious.\n\n\n---"
          }
        ]
      },
      {
        "title": "Family Limited Partnerships and LLCs: Controlling Assets You Don't Own",
        "content": [
          {
            "type": "heading",
            "text": "You can control everything and own nothing — and that's the strategy."
          },
          {
            "type": "body",
            "text": "A family limited partnership (FLP) or family LLC allows a senior generation to transfer assets to the next generation at a discount while retaining management control. Here's the structure: parents contribute assets (real estate, investments, a business) to the FLP. They retain the general partner interest — giving them 100% control over management decisions. They gift or sell limited partner interests to children over time. Limited partner interests are valued at a discount (typically 20–40%) from the underlying assets because they carry no control rights. This means $1 million of assets can be transferred for gift tax purposes at a valuation of $600,000–$800,000. The IRS-approved discount legally reduces the taxable transfer."
          },
          {
            "type": "callout",
            "text": "This structure accomplishes three things simultaneously: it removes assets from the taxable estate, it does so at a discounted valuation, and it keeps the senior generation in full operational control of the assets. You can give your children ownership of your real estate portfolio while retaining every decision-making right about it. The transfer happened on paper at a discount. The control never left."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Valuation Discounts Are Documented and Defensible",
            "text": "The IRS has challenged FLP discounts for decades — and lost the majority of those challenges when the structure is properly established and operated. The key requirements: the FLP must have a legitimate business purpose beyond tax savings, it must be operated as a real partnership, and assets must not be commingled with personal finances. Hire a qualified estate attorney and appraiser. The discount must be supportable by an independent valuation. Done correctly, this is one of the most powerful wealth transfer strategies in existence."
          },
          {
            "type": "action",
            "text": "If you own a business, real estate, or investment assets you intend to pass to heirs, research family limited partnerships. Write down your assets and their approximate value. Then calculate what 25% less than that value represents — that's the approximate tax savings a valuation discount could provide on transfer.\n\n\n---"
          }
        ]
      },
      {
        "title": "Life Insurance as a Wealth Transfer Vehicle",
        "content": [
          {
            "type": "heading",
            "text": "Life insurance death benefits pass to heirs completely income-tax free. This is one of the most powerful estate planning tools in existence."
          },
          {
            "type": "body",
            "text": "A $2 million life insurance death benefit paid to a beneficiary is received completely free of income tax. No capital gains. No ordinary income. Tax-free. When held inside an Irrevocable Life Insurance Trust (ILIT), the death benefit also passes outside the taxable estate — avoiding estate tax as well. Properly structured, life insurance is a mechanism to create instant, tax-free wealth for the next generation at a fraction of the cost."
          },
          {
            "type": "callout",
            "text": "A healthy 40-year-old can purchase a $1 million 20-year term policy for approximately $50–$80 per month. The leverage ratio is extraordinary: $50/month creates a $1 million tax-free inheritance. Permanent life insurance (whole life, IUL) builds cash value over time that can be borrowed against during your lifetime — the Infinite Banking concept from Module 5. For high-net-worth estate planning, the ILIT + permanent life insurance combination is the cornerstone strategy of every major wealth management firm."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Stretch IRA Replacement Strategy",
            "text": "The SECURE Act of 2019 largely eliminated the \"stretch IRA\" — the ability to pass a traditional IRA to heirs and have them take distributions over their lifetime. Now most non-spouse beneficiaries must fully withdraw an inherited IRA within 10 years, triggering significant income taxes. The workaround used by sophisticated planners: convert the IRA to a Roth (paying taxes now at potentially lower rates), and/or use the after-tax IRA funds to purchase life insurance inside an ILIT. The death benefit replaces the IRA value, passes tax-free, and is not subject to the 10-year withdrawal rule. Same wealth. No tax. Different structure."
          },
          {
            "type": "action",
            "text": "Research the cost of a $500,000 term life insurance policy for your age and health status on a comparison site like Policygenius. Then calculate: if you died tomorrow with no insurance, what financial burden would your family carry? Is that acceptable?\n\n\n---"
          }
        ]
      },
      {
        "title": "Charitable Giving as a Wealth Strategy (Not Just Altruism)",
        "content": [
          {
            "type": "heading",
            "text": "The wealthy give to charity for tax, legacy, and control reasons — not just generosity."
          },
          {
            "type": "body",
            "text": "A Donor-Advised Fund (DAF) allows you to make a charitable contribution, take an immediate tax deduction, and then distribute the funds to actual charities over time — years or even decades later. You give $100,000 in appreciated stock to a DAF today: you avoid capital gains tax on the appreciation, you take a full $100,000 charitable deduction against your income this year, and the money sits invested inside the DAF until you decide which charities receive it. The IRS gets nothing. The charity eventually gets the full amount. You get the deduction now."
          },
          {
            "type": "callout",
            "text": "Private foundations and Donor-Advised Funds are how wealthy families maintain multigenerational control over their philanthropic capital while minimizing taxes and maintaining public image. The Gates Foundation controls $67 billion. The Rockefeller Brothers Fund has operated since 1940. These are not charities in the way most people think of charities — they are family offices with a philanthropic wrapper, funded with pre-tax dollars, controlled by the family, and operating indefinitely."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Charitable Remainder Trusts",
            "text": "A Charitable Remainder Trust (CRT) allows you to contribute appreciated assets (real estate, stocks, business interests) to a trust, avoid immediate capital gains tax on the sale of those assets, receive an income stream for your lifetime from the trust, take a partial charitable deduction, and have the remaining balance pass to charity at death. This structure is used by business owners selling companies and real estate investors selling large appreciated holdings to defer and minimize the capital gains tax that would otherwise be due immediately."
          },
          {
            "type": "action",
            "text": "Look up Donor-Advised Fund minimums at Fidelity Charitable or Schwab Charitable — both have $5,000 minimums. If you give to charity regularly and have any appreciated assets, this structure likely saves you more in taxes than the entire cost of setting it up.\n\n\n---"
          }
        ]
      },
      {
        "title": "Building Your Own Legacy Architecture",
        "content": [
          {
            "type": "heading",
            "text": "You don't need $10 million to start building a generational structure. You need the right framework first."
          },
          {
            "type": "body",
            "text": "Legacy architecture is not a destination — it's a system you build incrementally. The foundation is a will and basic beneficiary designations (free to set, costs nothing, and yet over 60% of Americans have neither). The second layer is a revocable living trust to bypass probate. The third layer is the right entity structure for your assets — LLC, FLP, or corporation depending on what you own. The fourth layer is insurance to create instant wealth and fill gaps. The fifth layer is advanced structures — ILITs, dynasty trusts, CRTs — as your wealth justifies the complexity."
          },
          {
            "type": "callout",
            "text": "Most people do nothing because the entire picture feels overwhelming. The mistake is letting perfect be the enemy of functional. A will and updated beneficiary designations cost nothing and take two hours. A revocable trust costs $1,500–$3,000. These two steps protect your family from probate, ensure your wishes are followed, and can be done this week. Start there. Build from there."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Beneficiary Designation Override",
            "text": "Your will does not control what happens to your 401(k), IRA, life insurance, or any account with a named beneficiary. The beneficiary designation overrides the will entirely. This means if you named your ex-spouse as beneficiary on your 401(k) 15 years ago and never updated it, they receive that money regardless of what your will says. Courts have consistently upheld beneficiary designations over contradictory will provisions. The fix: log in to every financial account and insurance policy you own and review the beneficiary designations today."
          },
          {
            "type": "action",
            "text": "List every financial account, retirement account, and insurance policy you own. For each one, write down the current beneficiary. Are they current? Are they correct? Update any that are wrong or outdated.\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "Dynasty trusts are most effective at:",
        "options": [
          "Providing income to the grantor during retirement",
          "Passing assets across multiple generations outside the estate tax system",
          "Reducing income taxes on W-2 earnings",
          "Replacing a standard will"
        ],
        "correct": 1
      },
      {
        "q": "The annual gift tax exclusion allows each person to gift up to (2024):",
        "options": [
          "$5,000 per recipient",
          "$10,000 per recipient",
          "$18,000 per recipient",
          "$50,000 per recipient"
        ],
        "correct": 2
      },
      {
        "q": "Probate is problematic because:",
        "options": [
          "It distributes assets too quickly",
          "It is public, expensive, and can take 1–2 years",
          "It only applies to estates over $1 million",
          "It requires a jury trial"
        ],
        "correct": 1
      },
      {
        "q": "A valuation discount in a Family Limited Partnership works because:",
        "options": [
          "The IRS allows all family transfers to be discounted",
          "Limited partner interests carry no control rights and are legitimately valued below the underlying asset value",
          "Family members are exempt from gift tax rules",
          "The IRS does not audit family partnerships"
        ],
        "correct": 1
      },
      {
        "q": "A life insurance death benefit held in an ILIT:",
        "options": [
          "Is subject to income tax at the highest rate",
          "Passes income tax free and outside the taxable estate",
          "Must be distributed within 10 years",
          "Reduces Social Security benefits for heirs"
        ],
        "correct": 1
      },
      {
        "q": "A Donor-Advised Fund allows you to:",
        "options": [
          "Take a charitable deduction in a future tax year",
          "Take an immediate deduction and distribute to charities over time",
          "Avoid all income taxes permanently",
          "Pass assets to heirs without estate tax"
        ],
        "correct": 1
      },
      {
        "q": "The SECURE Act primarily affected estate planning by:",
        "options": [
          "Increasing the estate tax exemption",
          "Eliminating most stretch IRA distributions, forcing withdrawals within 10 years",
          "Reducing capital gains tax rates for inherited assets",
          "Requiring all trusts to register federally"
        ],
        "correct": 1
      },
      {
        "q": "Your beneficiary designations on retirement accounts and insurance:",
        "options": [
          "Can be overridden by your will if they conflict",
          "Are secondary to what your will states",
          "Override your will regardless of what it says",
          "Expire after 10 years automatically"
        ],
        "correct": 2
      },
      {
        "q": "A Charitable Remainder Trust is primarily useful for:",
        "options": [
          "People with no assets who want to give to charity",
          "Selling appreciated assets while deferring and minimizing capital gains tax",
          "Replacing Social Security income",
          "Funding a child's education"
        ],
        "correct": 1
      },
      {
        "q": "The correct order to build legacy architecture is:",
        "options": [
          "Dynasty trust first, then will",
          "Wait until you have $1M, then start",
          "Will and beneficiary designations first, then trust, then advanced structures as wealth grows",
          "Life insurance first and nothing else"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": 9,
    "title": "DeFi & The Parallel Financial System",
    "subtitle": "A financial system was built without permission. Here's how it works.",
    "icon": "🌐",
    "tag": "DEFI",
    "duration": "55–70 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "What DeFi Actually Is (And Why Banks Hate It)",
        "content": [
          {
            "type": "quote",
            "text": "DeFi is the most significant financial innovation since the invention of compound interest.",
            "author": "Unknown"
          },
          {
            "type": "heading",
            "text": "Decentralized Finance is a complete financial system that operates without banks, brokers, or permission."
          },
          {
            "type": "body",
            "text": "DeFi — Decentralized Finance — is a collection of financial applications built on blockchain networks (primarily Ethereum and Solana) that replicate and extend traditional financial services without centralized intermediaries. Lending, borrowing, trading, earning yield, insurance, derivatives — all of it runs on code that executes automatically when conditions are met. No loan officer. No brokerage account. No bank transfer. No minimum balance. No business hours. No geography. If you have an internet connection and a wallet, you have access to the same financial infrastructure that was previously available only to institutions."
          },
          {
            "type": "callout",
            "text": "In 2020, Total Value Locked (TVL) in DeFi protocols was approximately $1 billion. By 2021, it had reached $180 billion. The entire growth of the commercial banking system took centuries. DeFi replicated its core functions in under three years. The banking industry did not build this. They watched it happen and called it a fraud while filing for regulatory intervention with the other hand."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Why Banks Lobbied Against DeFi",
            "text": "The traditional financial system extracts approximately $3–5 trillion annually in fees globally — through interest spreads, transaction fees, management fees, and the float on deposits. DeFi eliminates most of these extraction points by replacing human intermediaries with automated smart contracts that take a fraction of a percent per transaction and distribute the yield to liquidity providers rather than shareholders. Every dollar DeFi moves is a dollar not flowing through a bank. The lobbying is not about protecting consumers. It's about protecting fee revenue."
          },
          {
            "type": "action",
            "text": "Look up the current Total Value Locked in DeFi at DeFiLlama.com. Then look up what the largest DeFi protocols by TVL are. Write down three you've never heard of before and what they do.\n\n\n---"
          }
        ]
      },
      {
        "title": "Decentralized Exchanges (DEXs): Trading Without a Middleman",
        "content": [
          {
            "type": "heading",
            "text": "You can swap any token for any other token, instantly, without creating an account."
          },
          {
            "type": "body",
            "text": "A centralized exchange (CEX) like Coinbase or Binance holds your assets in custody, requires KYC verification, can freeze your account, and takes fees on every trade. A decentralized exchange (DEX) like Uniswap, Jupiter, or Raydium runs entirely on smart contracts. You connect your own wallet, your assets never leave your custody, trades execute automatically against a liquidity pool, and there is no central party that can block, reverse, or freeze the transaction. DEXs process hundreds of billions of dollars in volume monthly with no CEO, no headquarters, and no bank account."
          },
          {
            "type": "callout",
            "text": "Uniswap — a DEX running on Ethereum — has processed over $2 trillion in cumulative trading volume. It is operated by a smart contract deployed to the Ethereum blockchain in 2018. It has never had a day off. It has never hired a compliance officer. It has never refused a trade based on geography or identity. It simply executes the code. Every single time."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Impermanent Loss: The Hidden Cost of Providing Liquidity",
            "text": "DEXs work because users provide liquidity — depositing pairs of tokens into pools that traders trade against. In exchange, liquidity providers earn a percentage of every trade that flows through their pool. But there's a risk most newcomers miss: impermanent loss. When the price ratio of the two tokens in your pool changes significantly, you end up with less total value than if you had simply held both tokens. The more volatile the pair, the greater the potential impermanent loss. Stable pairs (USDC/USDT) carry minimal impermanent loss. Highly volatile pairs can wipe out fee earnings entirely. Understand this before providing liquidity."
          },
          {
            "type": "action",
            "text": "Visit app.uniswap.org or jup.ag and connect a test wallet with minimal funds. Navigate the interface without executing any trade. Understand the process before committing capital. The interface is the least important part — understanding what's happening behind it is what matters.\n\n\n---"
          }
        ]
      },
      {
        "title": "DeFi Lending and Borrowing: Collateralized Loans Without Banks",
        "content": [
          {
            "type": "heading",
            "text": "You can borrow money without a credit check, an application, or a bank — using your crypto as collateral."
          },
          {
            "type": "body",
            "text": "DeFi lending protocols like Aave, Compound, and Solend allow users to deposit cryptocurrency as collateral and borrow against it — automatically, immediately, and without any identity verification. The system is overcollateralized: you must deposit more value than you borrow, typically 125–200% collateral for every 100% borrowed. This eliminates credit risk entirely — the protocol doesn't care who you are; it cares that your collateral covers the loan. If your collateral falls below the minimum threshold, it is automatically liquidated to repay the loan."
          },
          {
            "type": "callout",
            "text": "This is the same fundamental structure used by wealthy investors who borrow against stock portfolios — accessing liquidity without a taxable sale event. In traditional finance, this requires a margin account at a brokerage with minimum balances and relationship requirements. In DeFi, a 17-year-old in Southeast Asia with $500 in ETH can access the same mechanism. That is a genuine democratization of financial infrastructure."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Recursive Lending (Looping) — and Why It's Dangerous",
            "text": "Advanced DeFi users sometimes \"loop\" positions — deposit collateral, borrow against it, use borrowed funds to buy more collateral, deposit that, borrow again. This amplifies yield but also amplifies liquidation risk exponentially. A 10% price drop that would normally be manageable can trigger a cascade of liquidations in a looped position. Protocols like Aave have built-in health factors to warn of approaching liquidation. Looping is used by sophisticated participants who understand the math precisely. It has also wiped out fortunes of participants who didn't. Know the mechanics before attempting it."
          },
          {
            "type": "action",
            "text": "Look up the current supply and borrow APYs on Aave (app.aave.com). Compare what lenders are earning on USDC vs what a bank savings account pays. Write the difference. Then look up what the liquidation threshold is for ETH collateral. Understand the risk before the yield.\n\n\n---"
          }
        ]
      },
      {
        "title": "Yield Farming and Liquidity Mining: Earning on Your Assets",
        "content": [
          {
            "type": "heading",
            "text": "Your idle crypto can work while you sleep — but every yield has a source, and every source has a risk."
          },
          {
            "type": "body",
            "text": "Yield farming is the practice of deploying crypto assets into DeFi protocols to earn returns — through lending interest, trading fees, or protocol token emissions. Liquidity mining is a subset where protocols incentivize liquidity provision by distributing their own governance tokens as additional rewards. During the 2020–2021 DeFi boom, annualized yields of 100–1000% were advertised across dozens of protocols. Most of those yields were paid in newly created tokens that inflated and then collapsed. The real yields — backed by actual protocol revenue — were far smaller."
          },
          {
            "type": "callout",
            "text": "The question to ask of any yield: where does it come from? Trading fees from actual volume — real yield. Lending interest from actual borrowers — real yield. Newly minted protocol tokens distributed as incentives with no underlying economic activity — inflationary yield, not real yield. Understanding the difference separates sustainable income from yield that exists only to attract liquidity before collapsing. The crypto space has a long history of protocols that advertised extraordinary yields while the team was quietly exiting."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Real Yield Protocols",
            "text": "Following the 2022 DeFi collapse, a category called \"Real Yield\" emerged — protocols that distribute fees earned from actual economic activity rather than printed tokens. GMX (a derivatives DEX on Arbitrum) distributes actual trading fee revenue to stakers. Gains Network, Synthetix, and others followed. The yields are lower — 10–30% rather than 1000% — but they are backed by real transactions. Identifying protocols with genuine revenue and sustainable token economics is the difference between yield farming and gambling."
          },
          {
            "type": "action",
            "text": "Research one DeFi protocol currently offering yield. Identify: (1) where the yield comes from, (2) whether it's paid in the protocol's own token or in established assets, (3) what the protocol's TVL and revenue history look like on DeFiLlama.com. Write your assessment: real yield or inflationary yield?\n\n\n---"
          }
        ]
      },
      {
        "title": "DeFi Risks: What Can Actually Go Wrong",
        "content": [
          {
            "type": "heading",
            "text": "DeFi eliminates counterparty risk from banks. It introduces an entirely different set of risks."
          },
          {
            "type": "body",
            "text": "Smart contract risk: the code that runs DeFi protocols is written by humans and can contain bugs. The Ronin Bridge hack ($625 million), the Wormhole exploit ($320 million), the Poly Network hack ($611 million) — all were smart contract vulnerabilities. Oracle risk: DeFi protocols rely on price feeds from external sources called oracles. Manipulating an oracle can allow attackers to drain protocol funds. Liquidation risk: falling collateral values trigger automatic liquidations that can be faster and less forgiving than traditional margin calls. Rug pull risk: anonymous teams can deploy protocols, attract liquidity, and withdraw everything in a single transaction."
          },
          {
            "type": "callout",
            "text": "The total value stolen from DeFi protocols through hacks and exploits from 2020–2023 exceeds $6 billion. This is the cost of building financial infrastructure in public, without the protection of regulation and deposit insurance, at extraordinary speed. The protocols that have survived the most attack attempts — Aave, Uniswap, Compound, MakerDAO — have proven code bases, multiple audits, and years of battle-testing. Using battle-tested protocols is not a guarantee, but it is materially different from using a protocol launched last week by an anonymous team."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — How to Evaluate Protocol Safety",
            "text": "Before depositing into any DeFi protocol: (1) Check how many security audits the contracts have undergone and by whom — firms like Trail of Bits, OpenZeppelin, and Certik are credible auditors. (2) Check the age of the protocol — battle-tested code has survived real attack attempts. (3) Check TVL history — sudden spikes and collapses indicate instability. (4) Check if the team is doxxed (publicly identified) — anonymous teams have less accountability when things go wrong. (5) Start with small amounts regardless of confidence. The DeFi graveyard is full of people who were confident."
          },
          {
            "type": "action",
            "text": "Look up one major DeFi hack from the last three years. Research how it happened technically. Write a one-paragraph explanation in your own words. Understanding attack vectors is as important as understanding yield mechanisms.\n\n\n---"
          }
        ]
      },
      {
        "title": "DeFi on Solana: Speed, Cost, and the Iron Vault Connection",
        "content": [
          {
            "type": "heading",
            "text": "Ethereum built DeFi. Solana made it accessible to everyone."
          },
          {
            "type": "body",
            "text": "Ethereum's DeFi ecosystem is the largest and most battle-tested, but its transaction fees during periods of high demand have reached $50–$200 per transaction — pricing out small participants entirely. Solana's architecture — proof of history combined with proof of stake — allows throughput of 65,000+ transactions per second at fractions of a cent per transaction. This enables DeFi participation at any asset size, real-time settlement of income distributions, and the kind of high-frequency on-chain activity that's economically impractical on Ethereum at scale."
          },
          {
            "type": "callout",
            "text": "Jupiter is Solana's leading DEX aggregator — routing trades across all of Solana's liquidity pools to find the best execution price. Marinade Finance offers liquid staking of SOL — earning staking rewards while maintaining liquidity. Kamino Finance provides optimized yield strategies on Solana-native assets. The Solana DeFi ecosystem rebuilt rapidly after the FTX collapse of 2022 — which had outsized impact on Solana-adjacent projects — and has emerged with stronger fundamentals and a more retail-accessible product suite."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Staking vs Liquid Staking",
            "text": "Standard SOL staking locks your tokens for a warm-up and cool-down period of several days, during which they cannot be used. Liquid staking (through Marinade or Jito) gives you a liquid token (mSOL or jitoSOL) representing your staked position — which can be used as collateral in DeFi while still earning staking rewards. This means you earn base staking yield (currently 6–8% APY) AND can simultaneously use the liquid staking token as collateral to borrow against or provide liquidity. This is the DeFi equivalent of borrowing against your 401(k) while it keeps growing."
          },
          {
            "type": "action",
            "text": "Look up the current staking APY for SOL on Marinade.finance. Then look up what you can do with mSOL in Kamino or other Solana DeFi protocols. Map the full yield stack: base staking yield + potential additional DeFi yield on top.\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "DeFi differs from traditional finance primarily because:",
        "options": [
          "It is regulated by the SEC",
          "It operates through automated smart contracts without centralized intermediaries",
          "It is only available to accredited investors",
          "It requires a bank account to access"
        ],
        "correct": 1
      },
      {
        "q": "Total Value Locked (TVL) in DeFi grew from ~$1B to ~$180B in approximately:",
        "options": [
          "10 years",
          "1 year",
          "5 years",
          "6 months"
        ],
        "correct": 1
      },
      {
        "q": "A decentralized exchange (DEX) differs from a centralized exchange because:",
        "options": [
          "DEXs require more KYC documentation",
          "Assets never leave your custody and trades execute via smart contracts",
          "DEXs only support Bitcoin and Ethereum",
          "DEXs have lower trading volumes"
        ],
        "correct": 1
      },
      {
        "q": "Impermanent loss in liquidity provision occurs when:",
        "options": [
          "Gas fees exceed trading profits",
          "The price ratio of pooled tokens changes significantly, reducing total value vs simply holding",
          "The protocol is hacked",
          "You withdraw liquidity before 30 days"
        ],
        "correct": 1
      },
      {
        "q": "DeFi lending protocols are overcollateralized because:",
        "options": [
          "Regulators require it",
          "There is no credit check system, so collateral must exceed loan value to eliminate credit risk",
          "It maximizes yield for borrowers",
          "It is required by the Ethereum protocol"
        ],
        "correct": 1
      },
      {
        "q": "\"Real yield\" in DeFi refers to:",
        "options": [
          "Any yield above 10% APY",
          "Yields paid in Bitcoin only",
          "Yields backed by actual protocol revenue from real economic activity",
          "Yields guaranteed by a smart contract audit"
        ],
        "correct": 2
      },
      {
        "q": "The largest category of DeFi loss has come from:",
        "options": [
          "Inflation of protocol tokens",
          "Smart contract exploits and hacks",
          "Government seizures",
          "User error in sending funds"
        ],
        "correct": 1
      },
      {
        "q": "Liquid staking advantages over standard staking include:",
        "options": [
          "Higher guaranteed returns",
          "Government insurance on staked assets",
          "Maintaining liquidity through a tradeable token while still earning staking rewards",
          "Shorter lock-up periods only"
        ],
        "correct": 2
      },
      {
        "q": "Solana's primary advantage for DeFi participation compared to Ethereum is:",
        "options": [
          "Larger total value locked",
          "Older, more battle-tested smart contracts",
          "Higher throughput and lower fees making small transactions economically viable",
          "Better regulatory clarity"
        ],
        "correct": 2
      },
      {
        "q": "Before depositing into a DeFi protocol, a responsible first check is:",
        "options": [
          "Whether any celebrities promote it",
          "The current APY only",
          "Security audits, protocol age, TVL history, and team identity",
          "Whether it is listed on Coinbase"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": 10,
    "title": "Tokenized Real World Assets & the Ownership Revolution",
    "subtitle": "When physical assets meet programmable money — and why it changes everything",
    "icon": "🏗",
    "tag": "RWA",
    "duration": "55–70 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "What Real World Asset Tokenization Actually Means",
        "content": [
          {
            "type": "quote",
            "text": "The tokenization of assets will be the next generation for markets.",
            "author": "Larry Fink, CEO of BlackRock"
          },
          {
            "type": "heading",
            "text": "A $900 trillion pool of real-world assets is about to become programmable."
          },
          {
            "type": "body",
            "text": "Real World Asset (RWA) tokenization is the process of creating a digital representation of a physical or financial asset on a blockchain. Real estate, private credit, government bonds, commodities, art, infrastructure — any asset that has value can theoretically be tokenized. The token becomes a digital title to a portion of that asset. It can be bought, sold, held, used as collateral, and programmed to distribute income — all on-chain, all transparently, all without the friction, minimum investment requirements, and geographic restrictions of traditional asset markets."
          },
          {
            "type": "callout",
            "text": "The global real estate market is valued at approximately $330 trillion. The private credit market exceeds $1.5 trillion. Combined with bonds, commodities, and other real assets, the total addressable market for tokenization is estimated at $900 trillion. Currently, less than 0.1% of this is tokenized. BlackRock, JPMorgan, Goldman Sachs, Franklin Templeton, and virtually every major financial institution is actively building tokenization infrastructure. The window when this is still being built — before it becomes the dominant paradigm — is now."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Why Institutions Are Moving First",
            "text": "BlackRock's tokenized money market fund (BUIDL) reached $500 million in assets within weeks of launch in 2024. Franklin Templeton's tokenized Treasury fund operates on Stellar and Polygon. JPMorgan's Onyx platform processes billions in tokenized repo transactions daily. These institutions are not experimenting. They are repositioning their core infrastructure onto blockchain rails because it is faster, cheaper, and more transparent than legacy systems. Retail is not invited to this party — yet. But the infrastructure being built by institutions will ultimately be the rails that retail tokenized products run on."
          },
          {
            "type": "action",
            "text": "Look up BlackRock BUIDL on rwa.xyz or DeFiLlama's RWA section. Write down how much is currently locked in institutional tokenized assets. Then look up one retail-accessible RWA protocol. Compare the two.\n\n\n---"
          }
        ]
      },
      {
        "title": "Tokenized Real Estate: Fractional Ownership Without Barriers",
        "content": [
          {
            "type": "heading",
            "text": "Real estate has been a wealth builder for centuries. The minimum ticket has historically excluded most people. Tokenization is changing that."
          },
          {
            "type": "body",
            "text": "Traditional real estate investing has three major barriers: capital (down payments require tens to hundreds of thousands of dollars), liquidity (you cannot sell a 5% interest in an apartment building on a Tuesday afternoon), and access (the best deals flow through networks and relationships most people never enter). Tokenized real estate addresses all three. Platforms like Lofty, RealT, and Homium allow investors to purchase fractional ownership in properties for as little as $50. Income distributions are paid in stablecoins, often daily. The token is tradeable on secondary markets, creating liquidity that traditional real estate completely lacks."
          },
          {
            "type": "callout",
            "text": "A single-family rental property generating $1,200/month in net income, tokenized into 1,000 tokens at $100 each, distributes $1.20 per token per month to every holder — proportionally, automatically, and transparently. No property manager skimming. No accounting delay. No wire transfer. The smart contract receives the income and distributes it according to on-chain token balances. This is what Iron Vault is building toward — not a theoretical future, but an operational reality already being proven by early platforms."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Secondary Market Liquidity Premium",
            "text": "Illiquid assets trade at a discount because buyers demand compensation for being unable to exit. Tokenization adds a liquidity layer to historically illiquid assets — which means, over time, tokenized versions of the same underlying assets should trade at a premium to non-tokenized equivalents, because they offer exit options that didn't exist before. Early participants in tokenized real estate may benefit from this liquidity premium expansion as the market matures and secondary trading volume increases."
          },
          {
            "type": "action",
            "text": "Go to Lofty.ai or RealT.co. Browse current available properties. Look at the projected annual yield, the current token price, and the distribution history. Write down whether the yields compare favorably to other income investments you're aware of.\n\n\n---"
          }
        ]
      },
      {
        "title": "Tokenized Bonds and Private Credit: Institutional Yield Goes Retail",
        "content": [
          {
            "type": "heading",
            "text": "U.S. Treasury yields and private credit returns were previously inaccessible to most retail investors. On-chain, they're a wallet connection away."
          },
          {
            "type": "body",
            "text": "Tokenized U.S. Treasuries — short-term government debt — currently yield 4.5–5.5% annually with essentially no credit risk. Previously, direct access to Treasury instruments required brokerage accounts, minimum investments, and navigating the complexity of TreasuryDirect.gov. On-chain, protocols like Ondo Finance (OUSG), Superstate, and Mountain Protocol (USDM) allow any wallet holder to access Treasury-backed yield in stablecoin form — compounding daily, fully liquid, globally accessible."
          },
          {
            "type": "callout",
            "text": "Private credit — loans to businesses that don't qualify for traditional bank financing — historically yields 10–15% annually. It has been the exclusive domain of institutional investors and high-net-worth individuals who could meet $250,000+ minimums. Maple Finance, Clearpool, and TrueFi are bringing private credit on-chain at minimums accessible to retail participants. The yield differential between private credit and bank savings accounts — currently 12–15% vs 0.5–5% — represents an enormous arbitrage that was previously reserved for institutions."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Basis Trade on Tokenized Treasuries",
            "text": "Sophisticated DeFi participants use tokenized Treasury products as collateral in lending protocols — earning the Treasury yield AND using that collateral to borrow stablecoins to deploy elsewhere. If the Treasury token earns 5% and the borrowed stablecoins are deployed at 8%, the net spread after borrowing costs is additional yield on the same capital. This is not a reckless strategy — it's the same leveraged carry trade that hedge funds run on traditional Treasury positions, just executed on-chain with smart contract automation."
          },
          {
            "type": "action",
            "text": "Look up Ondo Finance's OUSG or Mountain Protocol's USDM. Find the current yield and the minimum investment. Compare it to your current savings account or money market rate. Write the actual dollar difference on $10,000 in capital annually.\n\n\n---"
          }
        ]
      },
      {
        "title": "The Regulatory Landscape for RWAs",
        "content": [
          {
            "type": "heading",
            "text": "The most important question about any tokenized asset is not the yield — it's the legal structure."
          },
          {
            "type": "body",
            "text": "A token is a wrapper. The value of what's inside the wrapper depends entirely on the legal structure that connects the digital token to the real-world asset it represents. A well-structured RWA token has a legal entity holding the underlying asset, a clear legal agreement connecting token holders to economic rights in that entity, regulatory compliance in the relevant jurisdiction, and transparent on-chain distribution mechanics. A poorly structured token is just a number on a blockchain with no enforceable claim on anything."
          },
          {
            "type": "callout",
            "text": "When evaluating any RWA project, the legal structure documentation is more important than the whitepaper. Who holds the underlying asset? In what legal entity? In what jurisdiction? What are the rights of token holders — economic interest, governance rights, neither? What happens to the asset if the issuing company fails? These questions have answers in a legitimate project. They have evasions and technical jargon in fraudulent ones. The sophistication to tell the difference is what this module builds."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Regulation D and the Accredited Investor Wall",
            "text": "Many tokenized asset offerings in the U.S. are issued under Regulation D — a securities exemption that restricts participation to accredited investors. This means the most legitimately structured RWA offerings may be legally inaccessible to non-accredited retail investors. The workaround that's emerging: protocols issuing from jurisdictions with clearer regulatory frameworks (Cayman Islands, British Virgin Islands, UAE) and offering tokens globally while blocking U.S. persons. The regulatory geography of where you participate matters enormously for both legal access and tax treatment."
          },
          {
            "type": "action",
            "text": "When you find an RWA protocol, locate its legal documentation. Look for: (1) the legal entity holding the underlying asset, (2) the jurisdiction, (3) whether it restricts U.S. persons. Write what you find. If the documentation doesn't exist or can't be found, that tells you everything you need to know.\n\n\n---"
          }
        ]
      },
      {
        "title": "Iron Vault's Position in the RWA Ecosystem",
        "content": [
          {
            "type": "heading",
            "text": "Iron Vault is not a speculation vehicle. It is a real-world asset infrastructure project built on verifiable fundamentals."
          },
          {
            "type": "body",
            "text": "Iron Vault Token operates within the broader RWA tokenization thesis: connecting real-world income-producing assets to on-chain distribution infrastructure. The Solana blockchain provides the settlement layer — fast, cheap, and capable of handling the transaction frequency required for regular income distributions. The token structure is designed to represent participation in the economic activity of underlying real assets, not speculative future value. The education-first model exists because an informed token holder understands what they own — and is therefore less susceptible to panic, manipulation, and mispricing."
          },
          {
            "type": "callout",
            "text": "Most RWA projects fail for one of three reasons: the legal structure is inadequate to enforce token holder rights, the underlying asset quality is poor, or the community panics and sells at the first adverse event because they don't understand what they own. Iron Vault's approach addresses all three directly: legal structure clarity, real asset focus, and education as the foundational layer before participation. This is not standard practice in the space. It should be."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Compounding Advantage of Early Structural Clarity",
            "text": "Projects that establish clear legal and operational frameworks early — before scaling — compound the benefit of that clarity over time. Regulatory scrutiny in the digital asset space is increasing, not decreasing. Projects that anticipated compliance requirements and built for them are positioned to expand as others are forced to restructure or shut down. The short-term cost of doing things correctly is the long-term moat."
          },
          {
            "type": "action",
            "text": "Write the three questions you would ask any RWA project before participating. Make them specific enough that a project team's answers would meaningfully differentiate a legitimate project from a fraudulent one.\n\n\n---"
          }
        ]
      },
      {
        "title": "Where RWA Tokenization Goes Next",
        "content": [
          {
            "type": "heading",
            "text": "We are in the first inning. The infrastructure being built now will define the next 20 years of global finance."
          },
          {
            "type": "body",
            "text": "The trajectory of RWA tokenization follows a predictable pattern: institutional infrastructure first, regulatory frameworks second, retail access third, mass adoption fourth. We are currently between phases one and two. BlackRock and JPMorgan are building the rails. Regulators in the EU (MiCA), UAE, Singapore, and increasingly the U.S. are establishing frameworks. The retail access layer — lower minimums, better UX, clearer legal rights — is being built in parallel. Mass adoption is likely 5–10 years out. But the participants who understand the infrastructure being built now are positioned to benefit most when the adoption curve accelerates."
          },
          {
            "type": "callout",
            "text": "The internet was the infrastructure layer that enabled everything that runs on top of it — email, social media, e-commerce, streaming, remote work. Blockchain is the infrastructure layer being built now. The people who understood the internet in 1997 weren't wrong about the technology. They were early. And early, in compounding systems, is the most valuable position."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Tokenization of Private Equity",
            "text": "Private equity — ownership stakes in non-public companies — has historically been the most exclusive asset class, with minimum investments of $1M+ and lock-up periods of 7–10 years. Tokenized private equity, emerging on platforms like Securitize and Polymesh, is reducing minimums to $10,000–$25,000 and creating secondary market liquidity that traditional PE funds don't offer. The return profile of private equity — historically 15–20% annually for top funds — is now being made accessible to a broader participant base. This is the final barrier. When it falls, the democratization of alternative investments is functionally complete."
          },
          {
            "type": "action",
            "text": "Research one of these: Securitize, Ondo Finance, or Maple Finance. Write what asset class they tokenize, what the minimum investment is, and whether U.S. investors can participate. Map it against a traditional equivalent — what was the minimum before tokenization?\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "Real World Asset tokenization primarily means:",
        "options": [
          "Creating fictional digital currencies backed by nothing",
          "Representing ownership or economic rights in physical or financial assets on a blockchain",
          "Converting cryptocurrency into government bonds",
          "Registering assets with the SEC"
        ],
        "correct": 1
      },
      {
        "q": "BlackRock's entry into tokenized assets signals:",
        "options": [
          "That tokenization is primarily a retail phenomenon",
          "That institutions are rebuilding their core financial infrastructure on blockchain rails",
          "That crypto assets are now government-insured",
          "That tokenization is illegal for retail investors"
        ],
        "correct": 1
      },
      {
        "q": "The primary barrier tokenized real estate removes is:",
        "options": [
          "Property taxes",
          "The need for property management",
          "High minimum investment requirements and illiquidity",
          "Mortgage requirements"
        ],
        "correct": 2
      },
      {
        "q": "Tokenized U.S. Treasury products are most comparable to:",
        "options": [
          "Speculative DeFi yield farming",
          "A high-yield savings account backed by government debt",
          "Equity investments in Treasury companies",
          "Physical gold holdings"
        ],
        "correct": 1
      },
      {
        "q": "The most important due diligence item for any RWA project is:",
        "options": [
          "The team's social media following",
          "The current APY offered",
          "The legal structure connecting the token to the underlying asset",
          "Whether a celebrity has endorsed it"
        ],
        "correct": 2
      },
      {
        "q": "Impermanent loss in RWA tokens differs from DeFi yield farming because:",
        "options": [
          "RWA tokens are backed by real assets that provide independent value",
          "RWA tokens can never lose value",
          "RWA tokens are government insured",
          "There is no difference"
        ],
        "correct": 0
      },
      {
        "q": "Regulation D in the U.S. restricts many RWA offerings to:",
        "options": [
          "Institutional investors only",
          "Non-U.S. persons only",
          "Accredited investors",
          "Investors with wallets older than one year"
        ],
        "correct": 2
      },
      {
        "q": "Iron Vault's education-first model addresses which RWA project failure mode:",
        "options": [
          "Insufficient token supply",
          "Community panic-selling due to not understanding what they own",
          "Regulatory approval delays",
          "Smart contract speed limitations"
        ],
        "correct": 1
      },
      {
        "q": "The \"liquidity premium\" in tokenized real estate refers to:",
        "options": [
          "Higher rents charged on tokenized properties",
          "The potential for tokenized assets to trade at a premium due to added exit liquidity",
          "Transaction fees charged by the tokenization platform",
          "The cost of converting tokens back to cash"
        ],
        "correct": 1
      },
      {
        "q": "RWA tokenization is currently in which phase of adoption:",
        "options": [
          "Full mass adoption",
          "Exclusively retail",
          "Primarily institutional infrastructure-building with retail access beginning to emerge",
          "Already replaced traditional finance entirely"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": 11,
    "title": "Building Income That Doesn't Require You",
    "subtitle": "The difference between a job, a business, and an asset",
    "icon": "⚙️",
    "tag": "SYSTEMS",
    "duration": "55–70 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "The Three Income Models (And Why Only One Scales)",
        "content": [
          {
            "type": "quote",
            "text": "If you don't find a way to make money while you sleep, you will work until you die.",
            "author": "Warren Buffett"
          },
          {
            "type": "heading",
            "text": "There are three ways to generate income. Two of them have a ceiling. One does not."
          },
          {
            "type": "body",
            "text": "Linear income: you trade time for money. Every dollar requires an hour. You stop working, the income stops. This is employment. It has a ceiling defined by the hours in a day and the market rate for your skill. Leveraged income: you trade time for money, but with a multiplier — employees, systems, or processes that amplify your output. A manager who oversees 10 people earns a return on their team's output. A business owner earns on the activity of the business. The ceiling is higher but the income is still tied to active management. Passive income: systems, assets, or intellectual property that generate income independent of your ongoing time. Rental property, dividends, royalties, automated digital products, token distributions. The ceiling is theoretically unlimited and entirely decoupled from hours worked."
          },
          {
            "type": "callout",
            "text": "The wealthy are not primarily wealthy because they earn more per hour. They are wealthy because they have built multiple income streams that operate without them. A $150,000 salary is impressive but fragile — one job loss eliminates it entirely. $50,000 from rental income, $40,000 from dividends, $30,000 from digital products, and $30,000 from consulting creates $150,000 that cannot be eliminated by any single event. Diversification of income sources is as important as diversification of investments."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The IRS's Passive Activity Rules",
            "text": "The IRS distinguishes between active income (wages, self-employment), portfolio income (dividends, interest, capital gains), and passive income (rental activity, limited partnerships). Passive losses can only offset passive income — you cannot use rental property losses to offset W-2 income unless you qualify as a \"real estate professional\" (750+ hours per year materially participating in real estate activities). Understanding this distinction changes how you structure your income streams and which losses are actually deductible against what."
          },
          {
            "type": "action",
            "text": "Map your current income. Write every source and classify it: linear, leveraged, or passive. Calculate what percentage of your income would survive if you stopped working entirely for 6 months. That percentage is your current level of financial resilience.\n\n\n---"
          }
        ]
      },
      {
        "title": "Digital Products: The Highest Margin Asset Class on Earth",
        "content": [
          {
            "type": "heading",
            "text": "A digital product costs roughly the same to sell to 10 people as to 10 million."
          },
          {
            "type": "body",
            "text": "A digital product — an ebook, online course, software tool, template, music track, photography preset, prompt library, data set — is created once and sold indefinitely with no incremental cost of production. The marginal cost of the second sale is approximately zero. This is the most favorable unit economics of any business model in history. A textbook author earns royalties on every copy sold for decades. A software developer earns on every license. A course creator earns on every enrollment. The asset was built once. The revenue compounds."
          },
          {
            "type": "callout",
            "text": "Gumroad, a platform for selling digital products, has processed over $1 billion in creator sales. Teachable and Thinkific host tens of thousands of course creators earning recurring income from content they built years ago. The individual creators on these platforms — not venture-backed companies, not large corporations — are running businesses with 70–90% profit margins on scalable products. This is not the future of work. It's the present of work for people who figured it out."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The \"1000 True Fans\" Math",
            "text": "Kevin Kelly's 2008 essay \"1000 True Fans\" proposed that a creator needs only 1,000 people who will spend $100/year on their work to generate $100,000 annually. In 2024, this math is conservative. A creator with 1,000 highly engaged followers on any platform selling a $97 course, $27/month membership, or $500 consulting package can generate life-changing income. The bottleneck is not platform size — it is depth of relationship and clarity of value. A creator with 10,000 followers and deep credibility consistently outearns one with 1,000,000 followers and shallow engagement."
          },
          {
            "type": "action",
            "text": "Write down three things you know deeply enough to teach, explain, or build tools around. For each, identify: (1) who would pay to learn it, (2) what format it would take (course, template, tool, membership), (3) what you would charge for it. You don't need to build any of it yet. The exercise is identifying your knowledge assets.\n\n\n---"
          }
        ]
      },
      {
        "title": "Licensing and Royalties: Getting Paid for What You've Already Created",
        "content": [
          {
            "type": "heading",
            "text": "A royalty is a system that pays you for something you did in the past. Build enough of them and the past funds the future."
          },
          {
            "type": "body",
            "text": "Royalties are payments for the ongoing use of something you own — intellectual property, creative works, patents, trademarks, proprietary systems. Musicians earn royalties every time a song is played. Authors earn royalties on every book sold. Patent holders earn royalties on every product manufactured using their patent. Franchise owners earn royalties from franchisees. Software companies earn license fees. The creator does the work once and the legal ownership of that work generates income indefinitely — often long after the creator is gone."
          },
          {
            "type": "callout",
            "text": "The estate of Michael Jackson earned over $700 million in the decade following his death. The estate of Elvis Presley earns tens of millions annually, 47 years after his death. These are extreme examples, but they illustrate a principle that applies at every scale: intellectual property that is properly owned, structured, and licensed is the most durable income asset a human being can build. Your business name, your proprietary process, your software, your content — these are potential royalty engines if you treat them as assets rather than activities."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Licensing Your Process, Not Just Your Product",
            "text": "You don't need to sell a song or publish a book to earn royalties. Any proprietary system, process, or methodology can be licensed. A sales training process licensed to sales organizations earns royalties on every use. A software tool licensed to agencies earns per seat. A branded system licensed as a franchise earns a percentage of revenue. The critical step: document the process, establish the IP ownership formally (through your entity), and structure licensing agreements. Most people have licensable assets and have never thought to structure them that way."
          },
          {
            "type": "action",
            "text": "Identify one thing you do — a process, a system, a methodology — that other people or businesses would pay to use or replicate. Write how it could be structured as a licensing arrangement: what would you charge, to whom, and on what terms?\n\n\n---"
          }
        ]
      },
      {
        "title": "Rental Income: The Oldest Passive Income Model in Human History",
        "content": [
          {
            "type": "heading",
            "text": "Someone pays you to use something you own. You sleep. They pay. Repeat indefinitely."
          },
          {
            "type": "body",
            "text": "Rental income is the most time-tested passive income model in existence. Real property, equipment, vehicles, tools, storage space, land — anything you own that someone else needs can generate rental income. The barrier most people cite is capital — you need money to buy the asset. This is true. But the capital required is often far lower than assumed: house hacking (renting rooms in a property you live in), renting equipment you already own, renting a parking space, storage space, or even a car through platforms like Turo. The scalable version is multi-unit real estate. But the habit of thinking about owned assets as income producers starts with whatever you already have."
          },
          {
            "type": "callout",
            "text": "House hacking — buying a duplex, triplex, or small multifamily property, living in one unit, and renting the others — is arguably the most powerful starting point for building a real estate portfolio. The rental income from other units offsets or eliminates the mortgage payment. You build equity, gain landlord experience, and reduce your personal housing cost simultaneously — often to zero. This is not a secret. It is actively practiced by real estate investors who started with nothing but are willing to optimize their living situation temporarily."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Short-Term Rental Arbitrage",
            "text": "You don't need to own property to generate rental income. Short-term rental arbitrage involves signing long-term leases on apartments with favorable terms and subletting them as short-term rentals (Airbnb, VRBO) at a significant premium — with landlord permission or in markets where it's permitted. A $2,000/month lease generating $4,000–$6,000/month in short-term rental revenue creates a cash flow spread with no property ownership required. This has been used to build multi-unit short-term rental operations with zero real estate capital. The risk: lease terms, platform policy changes, local regulations, and vacancy. Understand your market before deploying."
          },
          {
            "type": "action",
            "text": "Research median rental rates in your city for the property type you could realistically acquire in the next 2–3 years. Then calculate: at 20% down, what mortgage payment are you looking at? Is there a rental rate that creates positive cash flow? Write the math.\n\n\n---"
          }
        ]
      },
      {
        "title": "Building Systems That Run Without You",
        "content": [
          {
            "type": "heading",
            "text": "A business that requires the owner's presence every day is not a business. It's a job with overhead."
          },
          {
            "type": "body",
            "text": "The E-Myth Revisited by Michael Gerber distinguishes between the Technician (who does the work), the Manager (who organizes the work), and the Entrepreneur (who builds the system that does the work). Most small business owners are Technicians who built their own job. They work in the business, not on it. A business that generates income independently of the owner — through documented processes, trained staff, and automated systems — is an asset. One that stops generating income when the owner stops working is a job with a different name."
          },
          {
            "type": "callout",
            "text": "Amazon started as Jeff Bezos packing books in a garage. It became a system — a logistics, technology, and marketplace infrastructure — that now processes millions of transactions per day without Bezos touching a single package. The scale is extreme but the principle applies at every level. A $500,000/year service business with 5 employees and documented SOPs is an asset that could be sold, scaled, or operated by management. A $500,000/year freelance practice that stops when you stop is not."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — SOP Documentation as Valuation Multiplier",
            "text": "Buyers of businesses pay for certainty. A business with documented Standard Operating Procedures — for every role, every process, every customer interaction — sells at a higher multiple than one where the knowledge lives in the owner's head. An HVAC company with a 4x revenue multiple becomes a 6x multiple company when it has documented systems, trained staff, and proven processes that operate without the founder. The documentation is the asset. Writing it is the highest-leverage activity available to a business owner who intends to ever sell, raise capital, or simply take a vacation."
          },
          {
            "type": "action",
            "text": "If you have a business or side income, identify the one process that is most dependent on you personally. Write the steps of that process as if you were training a replacement to do it without asking you any questions. This is the beginning of building a system.\n\n\n---"
          }
        ]
      },
      {
        "title": "Stacking Income Streams: The Architecture of Financial Resilience",
        "content": [
          {
            "type": "heading",
            "text": "One income stream is a job. Two is a business. Five or more is a financial system."
          },
          {
            "type": "body",
            "text": "The goal is not to maximize any single income stream — it is to build a portfolio of streams that are uncorrelated, sustainable, and cumulatively sufficient to fund your life independent of employment. The streams reinforce each other: a business generates cash flow used to buy real estate. Real estate generates rental income used to fund digital product development. Digital products generate royalty income reinvested into crypto positions. Crypto distributions fund the next investment. Each stream feeds the system."
          },
          {
            "type": "callout",
            "text": "The sequence matters for most people who are starting from employment: (1) Build emergency reserve. (2) Eliminate bad debt. (3) Maximize tax-advantaged accounts. (4) Start one active side income (a skill-based service). (5) Convert active income surplus into passive assets (real estate, index funds, digital products). (6) Build and document systems that run the active income without full-time involvement. (7) Deploy passive assets into additional passive assets. The ladder exists. Most people are standing at step one looking at step seven and concluding it's impossible. It's not impossible. It's sequential."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The \"Money Flywheel\" Framework",
            "text": "A money flywheel is a self-reinforcing income system where each component generates output that feeds the next. The classic example: business cash flow → real estate acquisition → rental income → index fund contributions → dividend reinvestment → additional real estate. The flywheel builds slowly at first and accelerates as each component matures. The hardest part is the first 2–3 years when the flywheel has no momentum. The easiest part is year 10 when multiple compounding engines are all running simultaneously. Almost everyone quits before the momentum builds."
          },
          {
            "type": "action",
            "text": "Draw your personal money flywheel. Start with your current primary income source. Map where the surplus goes. Then design the flywheel you want to build — what feeds what, in what order. This is your blueprint.\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "Passive income is defined as:",
        "options": [
          "Income from part-time work",
          "Income that generates independent of your ongoing time through assets or systems",
          "Any income under $50,000/year",
          "Income received monthly rather than weekly"
        ],
        "correct": 1
      },
      {
        "q": "The highest margin digital products are so valuable because:",
        "options": [
          "They can be sold at unlimited prices",
          "The marginal cost of each additional sale is approximately zero",
          "They are tax-exempt",
          "They qualify for government subsidies"
        ],
        "correct": 1
      },
      {
        "q": "A royalty is best described as:",
        "options": [
          "A one-time payment for creative work",
          "Ongoing payment for the use of intellectual property you own",
          "A tax on high earners",
          "Revenue shared with investors"
        ],
        "correct": 1
      },
      {
        "q": "House hacking refers to:",
        "options": [
          "Purchasing foreclosed properties below market",
          "Buying a multi-unit property, living in one unit, and renting the others",
          "Renovating homes and flipping them quickly",
          "Hacking into property management systems"
        ],
        "correct": 1
      },
      {
        "q": "The E-Myth's core distinction is between:",
        "options": [
          "Employees and freelancers",
          "Working in a business vs. building a system that runs the business",
          "Profitable and unprofitable businesses",
          "Online and offline business models"
        ],
        "correct": 1
      },
      {
        "q": "Short-term rental arbitrage requires:",
        "options": [
          "Property ownership",
          "A real estate license",
          "Signing long-term leases and subletting at short-term rental rates with appropriate permissions",
          "At least $100,000 in capital"
        ],
        "correct": 2
      },
      {
        "q": "IRS passive activity rules mean:",
        "options": [
          "Passive losses can be deducted against any income",
          "Passive income is always tax-free",
          "Passive losses generally can only offset passive income",
          "Rental income is exempt from taxation"
        ],
        "correct": 2
      },
      {
        "q": "Documented SOPs increase business value because:",
        "options": [
          "They satisfy government compliance requirements",
          "They demonstrate the business can operate without the founder, increasing buyer certainty",
          "They reduce payroll costs automatically",
          "They are required for LLC formation"
        ],
        "correct": 1
      },
      {
        "q": "The \"1000 True Fans\" concept suggests:",
        "options": [
          "You need millions of followers to generate significant income",
          "1,000 deeply engaged customers spending meaningfully can generate sustainable creator income",
          "Social media following directly determines income",
          "You need a traditional publisher to monetize content"
        ],
        "correct": 1
      },
      {
        "q": "The correct sequence for building income streams generally starts with:",
        "options": [
          "Buying rental property immediately",
          "Launching a digital product first",
          "Building emergency reserves and eliminating bad debt before deploying capital",
          "Investing in crypto before anything else"
        ],
        "correct": 2
      }
    ]
  },
  {
    "id": 12,
    "title": "The Exit Strategy",
    "subtitle": "How the ultra-wealthy reduce, relocate, and restructure their tax obligations entirely",
    "icon": "🌍",
    "tag": "EXIT",
    "duration": "60–75 min",
    "xpReward": 500,
    "lessons": [
      {
        "title": "Flag Theory: Why the Ultra-Wealthy Are Citizens of the World",
        "content": [
          {
            "type": "quote",
            "text": "Diversify your assets across borders the same way you diversify them across asset classes.",
            "author": "PT Freeman, The Sovereign Individual"
          },
          {
            "type": "heading",
            "text": "No single government should have complete control over your income, assets, residence, or freedom of movement."
          },
          {
            "type": "body",
            "text": "Flag theory is the practice of distributing key aspects of your financial and personal life across multiple jurisdictions to minimize exposure to any single government's tax, regulatory, or legal reach. The concept was popularized by Harry Schultz and later W.G. Hill in the 1960s–70s and refined by subsequent generations of international tax planners. The core insight: you can legally establish your tax residence in a low-tax jurisdiction, hold assets in a stable jurisdiction with strong property rights, bank in a financially secure jurisdiction, and live where your quality of life is highest — all simultaneously, all legally."
          },
          {
            "type": "callout",
            "text": "Over 10,000 U.S. citizens renounce their citizenship annually — a record pace in recent years. Many more establish secondary residencies and foreign structures without renouncing. The wealthy do not leave their home country because they hate it. They leave because no single jurisdiction should be the sole arbiter of everything they've built. This is not unpatriotic. It is risk management applied to geopolitical and regulatory exposure."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Five Flags Framework",
            "text": "The original flag theory identified five key flags: (1) Passport/citizenship — a second passport from a country that doesn't tax worldwide income. (2) Tax residence — where you are legally domiciled for tax purposes. (3) Business base — where your company is incorporated. (4) Asset haven — where your investments and property are held. (5) Playgrounds — where you physically live and vacation. Optimizing each flag independently creates a structure where no single government has complete leverage over your financial life. This framework is used by international entrepreneurs, digital nomads, and ultra-high-net-worth individuals as standard practice."
          },
          {
            "type": "action",
            "text": "Research which countries currently offer territorial taxation — taxing only income earned within their borders, not worldwide income. Write a list of five. Then research which of those have viable residency programs.\n\n\n---"
          }
        ]
      },
      {
        "title": "Puerto Rico Act 60: The Most Powerful Tax Incentive Available to U.S. Citizens",
        "content": [
          {
            "type": "heading",
            "text": "Zero federal capital gains tax. Zero Puerto Rico capital gains tax. On U.S. soil. Legally."
          },
          {
            "type": "body",
            "text": "Puerto Rico's Act 60 (formerly Acts 20 and 22) offers U.S. citizens who establish bona fide residency in Puerto Rico a 0% tax rate on Puerto Rico-sourced capital gains and a 4% corporate tax rate on export services income. Because Puerto Rico is a U.S. territory, its residents are not subject to federal income tax on Puerto Rico-sourced income — this is a constitutional carve-out that has existed since 1917. A U.S. citizen who sells a cryptocurrency position, a business, or an investment portfolio after establishing bona fide residency and satisfying the sourcing requirements pays zero capital gains tax."
          },
          {
            "type": "callout",
            "text": "This is not a loophole. It is a deliberately structured tax incentive passed by the Puerto Rico legislature and signed into law. The U.S. federal government has repeatedly reviewed and allowed it. The IRS has issued guidance on compliance. Hundreds of successful crypto investors, hedge fund managers, and entrepreneurs have relocated and generated hundreds of millions of dollars in tax-free capital gains. The information exists in plain sight. Most people have never heard of it because the financial media that serves W-2 earners has no reason to cover it."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Bona Fide Residency Requirements (and Where People Fail)",
            "text": "The IRS has three tests for bona fide Puerto Rico residency: (1) Presence test — you must be in Puerto Rico for at least 183 days of the tax year. (2) Tax home test — your primary place of business or employment must be in Puerto Rico. (3) Closer connection test — Puerto Rico must be the place with which you have the closest personal and economic ties. People fail on the third test — maintaining a primary residence, family, and social ties on the mainland while being technically present in PR. The IRS looks at where your spouse and children live, where your doctor is, where you have club memberships, where your social relationships are concentrated. Bona fide residency requires genuine life relocation, not address changes."
          },
          {
            "type": "action",
            "text": "Look up the full IRS Publication 570 on Puerto Rico bona fide residency. Write the three tests in your own words. Then honestly assess: if you relocated to Puerto Rico, would you pass all three tests? What would need to change?\n\n\n---"
          }
        ]
      },
      {
        "title": "Citizenship by Investment: The Second Passport Playbook",
        "content": [
          {
            "type": "heading",
            "text": "A second passport is not a conspiracy. It's an insurance policy — and it costs less than you think."
          },
          {
            "type": "body",
            "text": "Citizenship by Investment (CBI) programs allow individuals to obtain citizenship of a foreign country in exchange for a qualifying investment — typically in real estate, government bonds, or a national development fund. Countries offering CBI programs include St. Kitts & Nevis, Dominica, Grenada, Antigua & Barbuda, Vanuatu, Malta, and several others. Investment thresholds range from approximately $100,000 (Dominica's national development fund contribution) to €750,000+ (Malta). A second passport provides optionality — the ability to reside, bank, and operate in multiple jurisdictions without dependence on any single government's goodwill."
          },
          {
            "type": "callout",
            "text": "U.S. citizens have one of the world's most powerful passports for travel access — but one of the most burdensome for tax purposes. The U.S. is one of only two countries (along with Eritrea) that taxes citizens on worldwide income regardless of where they live. A U.S. citizen living in Dubai still owes U.S. taxes. A Grenadian citizen living in Dubai owes nothing to Grenada. A second citizenship from a country with territorial or zero taxation is the first step to eventually structuring your tax obligations around where you actually live, not where you happened to be born."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — Grenada's CBI and E-2 Visa Arbitrage",
            "text": "Grenada holds a unique position: it is the only CBI country with a treaty with the United States that allows Grenadian citizens to apply for an E-2 investor visa — which allows residency in the United States with investment in a U.S. business, without requiring a green card. This means: obtain Grenadian citizenship ($150,000 real estate investment), then use the Grenadian passport to apply for a U.S. E-2 visa. Live in the U.S. without being a U.S. citizen. Pay taxes only on U.S.-sourced income. This is used by ultra-high-net-worth individuals who want to maintain a U.S. presence while restructuring their global tax profile. It requires significant legal and tax planning but it is entirely legal."
          },
          {
            "type": "action",
            "text": "Research the current investment threshold and processing time for one CBI program — Dominica, St. Kitts, or Grenada. Write: (1) what the minimum investment is, (2) what visa-free access the passport provides, (3) whether the country taxes worldwide income.\n\n\n---"
          }
        ]
      },
      {
        "title": "Offshore Structures: What's Legal, What Isn't, and What the Wealthy Actually Do",
        "content": [
          {
            "type": "heading",
            "text": "Offshore is not a crime. Tax evasion is. The line between them is structure and disclosure."
          },
          {
            "type": "body",
            "text": "An offshore company or trust is simply a legal entity established in a jurisdiction outside your home country. There are entirely legitimate reasons to use them: asset protection (certain jurisdictions have stronger creditor protection laws), estate planning (trust-friendly jurisdictions like Cayman or BVI), international business operations (holding companies for global operations), and tax efficiency (for non-U.S. persons, territorial tax jurisdictions offer legal tax reduction). The key requirement for U.S. persons: all foreign accounts, entities, and assets must be disclosed through FBAR (FinCEN 114), Form 8938 (FATCA), and entity-specific forms. Non-disclosure is tax evasion. Disclosure with proper structure is legal tax planning."
          },
          {
            "type": "callout",
            "text": "The Panama Papers and Pandora Papers revealed that virtually every major world leader, billionaire, and celebrity used offshore structures. The outrage was not that these structures are illegal — most of them are not. The outrage was the hypocrisy of people who publicly advocate for higher taxes while privately using every available structure to pay less. The structures themselves are legal. The disclosure requirements are clear. The people who got in trouble were those who used structures to hide assets, not to hold them."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Cayman Islands Structure for Investment Funds",
            "text": "The Cayman Islands is the domicile of choice for the majority of hedge funds globally — not because of secrecy, but because of legal clarity, neutral tax treatment, and sophisticated financial infrastructure. A Cayman Islands fund structure allows international investors to participate in a fund without triggering U.S. tax withholding, allows the fund itself to trade assets without triggering entity-level taxation, and provides clean legal documentation familiar to institutional investors worldwide. This is not tax evasion. It is structure optimization used by every sophisticated fund manager on earth. The same structures used by $10 billion funds are available to $1 million funds. The cost is legal fees, not minimum assets."
          },
          {
            "type": "action",
            "text": "Research the FBAR filing requirements for U.S. persons with foreign financial accounts. Write: (1) the threshold at which filing is required, (2) the penalty for non-compliance, (3) what types of accounts must be reported. Understanding the disclosure requirements is the prerequisite to understanding the structures.\n\n\n---"
          }
        ]
      },
      {
        "title": "Territorial Tax Countries: Living and Earning Without the IRS",
        "content": [
          {
            "type": "heading",
            "text": "For non-U.S. citizens — and for U.S. citizens who renounce — territorial tax countries are the ultimate financial optimization."
          },
          {
            "type": "body",
            "text": "Territorial tax countries only tax income earned within their borders. If you live in Panama and earn income from clients in the U.S., Europe, and Asia through a foreign company, Panama does not tax that income. If you live in Georgia (the country, not the state) and earn freelance income from international clients, Georgia taxes nothing. Dubai, the UAE, Bahrain, Qatar, Cayman Islands, BVI, Bermuda — all have zero income tax entirely. The growing global remote workforce is discovering that the combination of territorial tax residence and internet-enabled income creation effectively eliminates income tax as a cost of doing business."
          },
          {
            "type": "callout",
            "text": "Panama's Friendly Nations Visa, Portugal's NHR program (non-habitual resident), Georgia's Virtual Zone program, Paraguay's residency, and Malta's Global Residence Programme are all legitimate, well-documented residency programs that provide access to territorial or preferential tax treatment for qualifying foreign income. These are not secret. They are actively marketed by these governments because they attract capital and high-earning residents. The information asymmetry is entirely a function of who you know and what you read."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The U.S. Foreign Earned Income Exclusion",
            "text": "U.S. citizens living abroad who meet the bona fide foreign residence or physical presence test can exclude up to $126,500 (2024) of foreign earned income from U.S. taxation annually through the Foreign Earned Income Exclusion (FEIE). This does not eliminate the U.S. tax obligation — it reduces it significantly for those with foreign employment or self-employment income. Combined with the Foreign Tax Credit (for taxes paid to the foreign country), many Americans living abroad legally reduce their effective U.S. tax rate to near zero on foreign-earned income. The U.S. still taxes investment income, but the earned income exclusion alone can represent $30,000+ in annual tax savings."
          },
          {
            "type": "action",
            "text": "Research IRS Form 2555 (Foreign Earned Income Exclusion). Write the two tests to qualify — bona fide foreign residence and physical presence. Then calculate: on your current income, what would the FEIE save you annually if you lived abroad and qualified?\n\n\n---"
          }
        ]
      },
      {
        "title": "The Long Game: Building a Sovereign Financial Life",
        "content": [
          {
            "type": "heading",
            "text": "Freedom is not a net worth number. It's a structure."
          },
          {
            "type": "body",
            "text": "The synthesis of everything in this course — and in this module specifically — is this: freedom is a function of optionality, not balance. A person with $5 million in a single country, a single currency, and a single jurisdiction is fragile. A person with $500,000 across multiple income streams, multiple currencies, a second passport, and assets in two jurisdictions has more actual freedom — because they are not entirely dependent on any single system's continued cooperation. The wealthy don't build these structures because they're paranoid. They build them because they understand that governments change, currencies debase, regulations shift, and the only constant is uncertainty. Optionality is the hedge against all of it."
          },
          {
            "type": "callout",
            "text": "The Sovereign Individual — written in 1997 — predicted with remarkable accuracy that the rise of digital money, encrypted communications, and borderless commerce would shift power from nation-states toward individuals with the knowledge and capital to operate outside any single jurisdiction's control. That thesis is not fully realized yet. But the infrastructure being built — blockchain, global banking, CBI programs, territorial tax regimes, digital nomad visas — is exactly what was predicted. The people who understand the direction of travel, and position accordingly, benefit most from the transition."
          },
          {
            "type": "vault",
            "title": "VAULT SECRET — The Final Structure: Multi-Jurisdictional Wealth Architecture",
            "text": "A fully optimized structure for a high-net-worth individual might look like: Grenadian citizenship (obtained through CBI program, ~$150,000). Puerto Rico Act 60 residency for U.S.-sourced gains during the transition period. A Cayman Islands holding company for investment assets. A UAE free zone company for international business operations. Banking across Switzerland, Singapore, and a U.S. institution. Life insurance in Liechtenstein. Digital assets in self-custody. Real estate in two jurisdictions. This is not a plan for a billionaire. Variations of this structure are used by people with $1–5 million in assets who have spent the time and legal fees to build it correctly. The total cost to establish: $50,000–$150,000 in legal and filing fees. The annual tax savings on $1M in capital gains: potentially $150,000–$400,000. The math justifies the architecture at far lower wealth levels than most people assume."
          },
          {
            "type": "action",
            "text": "Write your personal exit strategy blueprint — not as a plan to execute today, but as a 10-year target architecture. Which jurisdictions interest you? What residency requirements could you realistically meet? What would the structure cost to establish vs. the annual tax savings? Write the math.\n\n\n---"
          }
        ]
      }
    ],
    "quiz": [
      {
        "q": "Flag theory is best described as:",
        "options": [
          "A strategy to avoid all legal obligations internationally",
          "Distributing key aspects of your financial and personal life across multiple jurisdictions to reduce dependence on any single government",
          "A method to obtain multiple passports illegally",
          "A conspiracy theory about government surveillance"
        ],
        "correct": 1
      },
      {
        "q": "Puerto Rico Act 60's capital gains tax rate for qualifying residents is:",
        "options": [
          "15%",
          "5%",
          "20%",
          "0%"
        ],
        "correct": 3
      },
      {
        "q": "The IRS bona fide residency test for Puerto Rico requires:",
        "options": [
          "Simply having a Puerto Rico mailing address",
          "30 days physical presence per year",
          "Meeting presence, tax home, and closer connection tests",
          "Renouncing U.S. citizenship"
        ],
        "correct": 2
      },
      {
        "q": "Citizenship by Investment programs allow:",
        "options": [
          "Illegal immigration through investment",
          "Obtaining citizenship of a foreign country through qualifying investment",
          "Avoiding all taxes permanently worldwide",
          "Purchasing a U.S. green card directly"
        ],
        "correct": 1
      },
      {
        "q": "The U.S. is unusual in international taxation because:",
        "options": [
          "It has the world's lowest tax rates",
          "It taxes citizens on worldwide income regardless of where they live",
          "It does not tax investment income",
          "It allows unlimited foreign income exclusions"
        ],
        "correct": 1
      },
      {
        "q": "The Grenada CBI program is uniquely valuable because:",
        "options": [
          "It offers the lowest investment threshold of any CBI program",
          "It provides visa-free access to all countries",
          "Grenadian citizens can apply for a U.S. E-2 investor visa",
          "It includes a guaranteed return on investment"
        ],
        "correct": 2
      },
      {
        "q": "Offshore structures become illegal when:",
        "options": [
          "They are used by non-U.S. persons",
          "They involve assets in the Cayman Islands",
          "They are used to hide assets from required disclosure",
          "They hold more than $1 million in assets"
        ],
        "correct": 2
      },
      {
        "q": "The Foreign Earned Income Exclusion (FEIE) allows qualifying U.S. citizens abroad to exclude approximately:",
        "options": [
          "$50,000 annually",
          "$126,500 annually (2024)",
          "All income without limit",
          "$10,000 monthly"
        ],
        "correct": 1
      },
      {
        "q": "Territorial tax countries are advantageous because:",
        "options": [
          "They have no laws governing business activity",
          "They only tax income earned within their borders, exempting foreign-sourced income",
          "They provide automatic citizenship to investors",
          "They are immune to international tax treaties"
        ],
        "correct": 1
      },
      {
        "q": "The core principle of sovereign financial architecture is:",
        "options": [
          "Hiding wealth from all governments",
          "Concentrating all assets in the strongest currency",
          "Building optionality across jurisdictions so no single government controls your entire financial life",
          "Renouncing citizenship as soon as possible"
        ],
        "correct": 2
      }
    ]
  }
];

const MODULES = [
  FREE_MODULE_0,
  {
    id: 1, title: "Money & Wealth Basics", subtitle: "Unlearn everything you were taught",
    icon: "₿", tag: "FOUNDATION", duration: "45–60 min", xpReward: 500,
    lessons: [
      {
        title: "What Money Actually Is — And Who Controls It",
        content: [
          { type: "quote", text: "Give me control of a nation's money supply, and I care not who makes its laws.", author: "Mayer Amschel Rothschild, 1838" },
          { type: "heading", text: "Money serves three functions" },
          { type: "list", items: ["Medium of Exchange — replaces barter", "Unit of Account — measures value consistently", "Store of Value — preserves purchasing power over time"] },
          { type: "body", text: "Modern money is fiat currency. It has value because the government says it does — not because it's backed by gold, silver, or anything tangible. The U.S. officially left the gold standard in 1971. Before that, every dollar was redeemable for a fixed amount of gold." },
          { type: "callout", text: "In 1913, the Federal Reserve was created. Most Americans believe the Fed is a government agency. It is not. It is a private banking institution — owned by private member banks — that controls the U.S. money supply. This was not taught in your school. Ask yourself why." },
          { type: "vault", title: "VAULT SECRET: The Money Creation Trick", text: "When the Federal Reserve wants to inject money into the economy, it doesn't print bills — it buys government bonds with money it creates from nothing. This is called 'open market operations.' The money didn't exist yesterday. Today it does. Who pays? Everyone holding dollars, through inflation. This is the hidden tax on the working class." },
          { type: "body", text: "Money is a tool. Not your identity, your worth, or your security. The wealthy treat it as a system to be understood and leveraged. The middle class treats it as something to be earned and spent. The poor treat it as something that was never meant for them." },
          { type: "action", text: "Research: Who are the private member banks of the Federal Reserve? Write what you find." }
        ]
      },
      {
        title: "Inflation — The Silent Tax on the Poor",
        content: [
          { type: "quote", text: "By a continuing process of inflation, government can confiscate, secretly and unobserved, an important part of the wealth of their citizens.", author: "John Maynard Keynes" },
          { type: "heading", text: "The dollar has lost 97% of its purchasing power since 1913" },
          { type: "body", text: "That is not a typo. The same year the Federal Reserve was created, the dollar began its century-long decline. What cost $1 in 1913 costs approximately $31 today. Your grandparents' savings — destroyed. Your parents' retirement — eroding. Yours? Already shrinking." },
          { type: "callout", text: "This is called the Cantillon Effect — a concept economists rarely teach publicly. When new money is created, it doesn't distribute equally. It flows first to banks and large institutions, who spend it before prices rise. By the time new money reaches workers through wages, prices have already increased. The wealthy gain. The working class loses. Every. Single. Time." },
          { type: "vault", title: "VAULT SECRET: How the Wealthy Beat Inflation", text: "They don't hold dollars. They hold assets. Real estate, businesses, commodities, equity — things that rise in price WITH inflation. The poor are told to 'save money.' The wealthy are told to 'own things.' A savings account earning 0.5% when inflation runs 7% is not saving — it's a slow bleed. The bank profits from your compliance." },
          { type: "body", text: "This is not a conspiracy. It's economics. Understanding it is the first step to playing a different game." },
          { type: "action", text: "Look up the price of a median home, a gallon of milk, and a college degree in 1971 vs today. Then ask: was the American Dream stolen, or was it always sold?" }
        ]
      },
      {
        title: "Budgeting — But Make It Real",
        content: [
          { type: "quote", text: "It's not about how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.", author: "Robert Kiyosaki" },
          { type: "heading", text: "A budget is a plan — not a cage" },
          { type: "body", text: "The 50/30/20 rule is a starting framework — 50% needs, 30% wants, 20% savings and debt reduction. But the wealthy don't budget their personal income the same way. They route income through entities. They structure their life so that expenses become deductible." },
          { type: "callout", text: "A W-2 employee earns money, pays taxes, then spends what's left. A business owner earns money, spends on legitimate business expenses, then pays taxes on what's left. Same income. Radically different tax outcome. The system was built this way on purpose — to reward ownership over labor." },
          { type: "vault", title: "VAULT SECRET: The LLC Expense Play", text: "When you own an LLC, your car (if used for business), your phone, your home office, certain meals, travel, education, and software subscriptions may become deductible business expenses. You pay for these with pre-tax dollars instead of post-tax dollars. A $1,000 expense with a 30% tax rate effectively costs you $700. The wealthy know this. It's legal. It's accessible. And nobody tells you about it in school because employees are easier to tax." },
          { type: "action", text: "Track every dollar for 30 days. Then ask: how many of these expenses could be legitimate business deductions if you had an LLC?" }
        ]
      },
      {
        title: "Assets vs Liabilities — The Real Divide",
        content: [
          { type: "quote", text: "The rich don't work for money. They make money work for them.", author: "Robert Kiyosaki, Rich Dad Poor Dad" },
          { type: "heading", text: "An asset puts money in your pocket. A liability takes money out." },
          { type: "list", items: ["Assets: rental property, businesses, investments, intellectual property, systems that generate cash", "Liabilities: high-interest debt, depreciating vehicles, luxury items financed on credit, money spent to impress others"] },
          { type: "body", text: "The middle class is sold the idea that their house is their biggest asset. In most cases, a primary residence is a liability — it costs money in taxes, maintenance, and mortgage interest every single month. A rental property that generates income above expenses is an asset." },
          { type: "vault", title: "VAULT SECRET: Buy, Borrow, Die", text: "This is the actual strategy ultra-wealthy families use to build generational wealth without paying capital gains taxes. Step 1: Buy appreciating assets (real estate, stocks, businesses). Step 2: Never sell them — borrow against them instead. Loans are not taxable income. You get the spending power of your wealth without a taxable event. Step 3: Die. When assets transfer to heirs, the cost basis resets to current market value — eliminating all accumulated capital gains. The wealthy pay zero tax on a lifetime of gains. This is legal. This is documented. This is why Bezos, Musk, and Zuckerberg can 'not earn much' on paper while living like gods." },
          { type: "action", text: "List everything you own. Mark each: Asset (cash flow positive), Liability (cash flow negative), Neutral. Be honest." }
        ]
      },
      {
        title: "Emergency Funds — Your First Defense",
        content: [
          { type: "heading", text: "You cannot build wealth from a position of desperation" },
          { type: "body", text: "The majority of Americans cannot cover a $1,000 emergency without going into debt. This is not laziness — it's the design of a system that profits from financial instability. Payday lenders charge 400% APR. Credit card companies earn billions from minimum payment traps. Banks make money when you're broke and desperate." },
          { type: "callout", text: "Cash margin creates decision-making power. When you have reserves, you can walk away from bad jobs, bad deals, and bad situations. When you have none, you stay trapped — and the system knows this." },
          { type: "list", items: ["Target 1: $1,000 emergency fund — break the debt cycle", "Target 2: 1 month of expenses — breathing room", "Target 3: 3–6 months — true financial leverage"] },
          { type: "vault", title: "VAULT SECRET: Where to Actually Keep It", text: "Don't keep your emergency fund in a big bank savings account earning 0.01%. High-Yield Savings Accounts (HYSAs) through online banks like Marcus, Ally, or SoFi offer 4-5% APY with full FDIC insurance. Same safety. 400-500x the return. The big banks advertise heavily and count on your inertia. Move the money. It's a 10-minute account setup." },
          { type: "action", text: "Calculate your monthly survival number. Multiply by 3. That's your freedom number. How far are you from it?" }
        ]
      },
      {
        title: "Goals That Actually Change Your Life",
        content: [
          { type: "quote", text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
          { type: "heading", text: "Vague goals produce vague results" },
          { type: "body", text: "Use the SMART framework: Specific, Measurable, Achievable, Relevant, Time-bound. 'I want to be rich' is not a goal. 'I will establish an LLC, open a business checking account, and generate $2,000 in side revenue within 90 days' is a goal." },
          { type: "callout", text: "The wealthy think in decades. The middle class thinks in months. The poor think in days. Time horizon is one of the greatest wealth separators that nobody talks about. A decision that costs you today but compounds over 20 years is the move most people are too impatient to make." },
          { type: "vault", title: "VAULT SECRET: The Entity Mindset", text: "Stop thinking about building a bank account. Start thinking about building an entity — a legal structure (LLC, S-Corp, Trust) that holds assets, receives income, and creates separation between you and your finances. The wealthy don't own things personally. Their entities do. Their entities get the tax breaks. Their entities borrow money. Their personal name stays clean and low-profile. This is not a gray area. Every single major wealth-builder uses entities. You just weren't taught about them." },
          { type: "action", text: "Write your 30-day, 12-month, and 5-year goals — but frame each one around building an entity or system, not just saving a number." }
        ]
      }
    ],
    quiz: [
      { q: "Money serves which three primary functions?", options: ["Entertainment, credit, debt", "Medium of exchange, unit of account, store of value", "Borrowing, investing, saving", "Spending, taxes, budgeting"], correct: 1 },
      { q: "The Federal Reserve is best described as:", options: ["A fully government-owned agency", "A private banking institution that controls U.S. money supply", "A department of the U.S. Treasury", "An international bank based in Switzerland"], correct: 1 },
      { q: "The Cantillon Effect describes:", options: ["How inflation affects everyone equally", "How newly created money benefits those closest to its source first", "Why gold is the best investment", "How taxes are collected"], correct: 1 },
      { q: "Under the 50/30/20 method, 20% is commonly used for:", options: ["Luxury spending", "Taxes only", "Savings and debt reduction", "Rent and utilities"], correct: 2 },
      { q: "The 'Buy, Borrow, Die' strategy allows the wealthy to:", options: ["Pay higher taxes than average citizens", "Access wealth without taxable income events", "Earn interest from savings accounts", "Avoid estate planning entirely"], correct: 1 },
      { q: "Which is generally considered bad debt?", options: ["Low-interest loan for productive growth", "Credit card debt at high interest", "Mortgage with manageable payments", "Business equipment with clear ROI"], correct: 1 },
      { q: "A starter emergency fund target is often:", options: ["$50", "$1,000", "$25,000 minimum", "No savings needed"], correct: 1 },
      { q: "The U.S. officially left the gold standard in:", options: ["1913", "1945", "1971", "1999"], correct: 2 },
      { q: "A business owner vs a W-2 employee primarily differs in that:", options: ["Business owners earn more always", "Business owners pay taxes after expenses; employees pay taxes before spending", "W-2 employees get more deductions", "There is no meaningful tax difference"], correct: 1 },
      { q: "What is the primary advantage of a High-Yield Savings Account over a big bank savings account?", options: ["No FDIC insurance needed", "Significantly higher interest rates with same safety", "Only available to wealthy clients", "Requires a minimum of $100,000"], correct: 1 }
    ]
  },
  {
    id: 2, title: "How the Economy Actually Works", subtitle: "The 10 concepts they never taught you in school",
    icon: "⚙️", tag: "ECONOMICS", duration: "50–65 min", xpReward: 500,
    lessons: [
      { title: "The Velocity of Money", content: [{ type: "heading", text: "The same dollar can create vastly different economic impact depending on how fast it moves" }, { type: "body", text: "A dollar spent at a local business circulates more times than a dollar spent at a large corporation. Economic energy is not just about amount — it's about speed. This is why communities with high local spending build wealth faster than those that export every dollar to distant corporations." }, { type: "callout", text: "When the Fed injects money into the economy through large banks, velocity drops — because institutions hold capital rather than circulate it. When money reaches individuals who spend locally, velocity spikes. Same dollar. Completely different economic outcome." }, { type: "vault", title: "VAULT SECRET: Why Local Business Ownership Compounds", text: "A business owner who spends locally, hires locally, and reinvests locally creates a multiplier effect on their own community. Every dollar they circulate comes back to them in some form — through customers, partnerships, and property values. This is not charity. This is systems thinking." }, { type: "action", text: "Track where your last 10 purchases went. Local business or national chain? Calculate how much of your spending stays in your community versus leaves it." }] },
      { title: "Asymmetric Information", content: [{ type: "heading", text: "One party knows more than the other — and the side with less information always pays the tax" }, { type: "body", text: "Insurance companies know more about risk than you do. Car dealerships know more about vehicle value than you do. Lenders know more about loan terms than most borrowers. This information gap is not accidental — it is the structural advantage that allows these industries to extract value from every transaction." }, { type: "callout", text: "This is the root of 'the house always wins.' The house does not win because of luck. It wins because it has more information, better models, and longer time horizons than the average participant." }, { type: "vault", title: "VAULT SECRET: How to Close the Gap", text: "Every hour you spend learning an industry's mechanics reduces the tax you pay to participate in it. The investor who understands cap rates, NOI, and debt coverage ratios negotiates better deals than one who doesn't. Education is not self-improvement. It is arbitrage against the information gap." }, { type: "action", text: "Pick one financial product you currently use — insurance, mortgage, credit card. Spend one hour learning exactly how the provider makes money from you. Write what you find." }] },
      { title: "Arbitrage", content: [{ type: "heading", text: "Buy where it's cheap, sell where it's expensive — but the deeper lesson goes further" }, { type: "body", text: "Markets are never perfectly efficient. Gaps always exist — in price, in information, in timing, in geography. The people who spot those gaps and act on them extract the value that others leave behind." }, { type: "callout", text: "Geographic arbitrage: earning income from a high-cost market while living in a low-cost one. Labor arbitrage: hiring skilled workers in markets where compensation is lower. Time arbitrage: building assets today that pay in a future where your time is more scarce." }, { type: "vault", title: "VAULT SECRET: Attention Arbitrage", text: "Right now, certain platforms and asset classes are underpriced in terms of attention. The people who build audiences, brands, and positions on these platforms before they become crowded will extract the same value early internet adopters did." }, { type: "action", text: "Identify one market, skill, or platform where you have more knowledge than average. Write how you could monetize that gap in the next 90 days." }] },
      { title: "Opportunity Cost", content: [{ type: "heading", text: "Every choice has a hidden price — the value of the next best alternative" }, { type: "body", text: "Most people only calculate the cost of action. Almost nobody calculates the cost of inaction. Keeping money in a savings account earning 0.5% when inflation runs 4% has a real cost — you are losing 3.5% of purchasing power annually." }, { type: "callout", text: "This is why procrastination is the most expensive habit on earth. Not because of the time lost — because of the compounding returns never started." }, { type: "vault", title: "VAULT SECRET: The Opportunity Cost of Employment", text: "A $75,000 salary feels different when you calculate its opportunity cost. The same 40 hours per week directed toward building a scalable asset has a fundamentally different ceiling. Employment trades time for money linearly. Ownership compounds." }, { type: "action", text: "Calculate the opportunity cost of your current largest financial decision. What is the next best use of that money or time?" }] },
      { title: "Elasticity of Demand", content: [{ type: "heading", text: "Some prices can rise without killing demand. Some collapse instantly." }, { type: "body", text: "Gas, rent, and medication are inelastic — demand holds even as price rises because people have no immediate alternative. Luxury goods and discretionary spending are elastic — demand drops quickly when price moves." }, { type: "callout", text: "The most durable businesses in history sell inelastic products or services. Landlords hold pricing power because people cannot opt out of shelter." }, { type: "vault", title: "VAULT SECRET: Build Inelastic Income", text: "The goal of any sophisticated wealth strategy is to build income streams that are inelastic — where your customers have no easy alternative to paying you. Rental income, proprietary software, essential services, specialized expertise." }, { type: "action", text: "List your current income sources. For each one, ask: how easy is it for the payer to replace me?" }] },
      { title: "The Principal-Agent Problem", content: [{ type: "heading", text: "The person making decisions is not the person who bears the consequences" }, { type: "body", text: "Employees versus owners. Politicians versus citizens. Financial advisors versus clients. In every case, the agent makes decisions with other people's money, time, or outcomes — and their incentives are rarely perfectly aligned." }, { type: "callout", text: "A financial advisor paid on commission recommends products that pay the highest commission. A fund manager paid on assets under management grows the fund even when returns are poor." }, { type: "vault", title: "VAULT SECRET: Align Incentives or Exit", text: "The solution to the principal-agent problem is either aligning incentives — equity, performance-based compensation, skin in the game — or removing the agent entirely. Self-directed investing removes the advisor. Business ownership removes the employer." }, { type: "action", text: "Identify every agent currently making decisions that affect your financial life. For each one, write their actual incentive. Is it aligned with yours?" }] },
      { title: "Animal Spirits", content: [{ type: "quote", text: "The market can remain irrational longer than you can remain solvent.", author: "John Maynard Keynes" }, { type: "heading", text: "Human emotion drives markets more than math" }, { type: "body", text: "Keynes called it animal spirits — the idea that confidence, fear, and euphoria move capital faster and further than any spreadsheet. Fear and euphoria move trillions of dollars — often faster than fundamentals justify in either direction." }, { type: "callout", text: "Bitcoin did not rise to $60,000 because of a discounted cash flow model. It rose because millions of people believed it would. That belief — collective animal spirit — was itself the fundamental." }, { type: "vault", title: "VAULT SECRET: Use Sentiment as a Signal", text: "When everyone is euphoric, risk is highest. When everyone is panicking, opportunity is greatest. The investors who built generational wealth in 2008, in March 2020, and in crypto winters did so by moving opposite to the dominant emotional current." }, { type: "action", text: "Find an asset class currently experiencing extreme fear or extreme euphoria. Write the rational case for why the emotional extreme may be creating a mispricing." }] },
      { title: "Marginal Analysis", content: [{ type: "heading", text: "The next unit of effort, cost, or output matters more than the total" }, { type: "body", text: "Businesses live or die on the margin — not the average. The question is never 'what did this cost in total?' The question is 'what does one more unit cost, and what does it produce?'" }, { type: "callout", text: "A rental property generating $500 per month net is attractive. The question marginal analysis asks: what does acquiring one more property cost — in time, capital, and management burden?" }, { type: "vault", title: "VAULT SECRET: Your Marginal Hour", text: "The marginal value of your time changes as your income grows. The first hour of work pays one rate. The hour spent building a system that runs without you pays compounding returns indefinitely." }, { type: "action", text: "Calculate the marginal return on your last three major decisions. Was the margin improving or declining?" }] },
      { title: "The Accelerator Effect", content: [{ type: "heading", text: "When the economy grows, investment accelerates — not linearly, but exponentially" }, { type: "body", text: "Small increases in consumer demand trigger disproportionately large increases in business investment. A 10% increase in demand might trigger a 30% increase in capital expenditure as businesses race to capture the growing market." }, { type: "callout", text: "This same principle applies to your personal financial trajectory. Small improvements in income, savings rate, and investment return compound into exponentially different outcomes over a decade." }, { type: "vault", title: "VAULT SECRET: Position Before the Acceleration", text: "Every major technology cycle — internet, mobile, social, crypto, AI — has an acceleration phase where early participants benefit disproportionately. The window to position before acceleration is always shorter than it looks in hindsight." }, { type: "action", text: "Identify one technology or market currently in early adoption. Write the case for why acceleration may be coming." }] },
      { title: "The Circular Flow of Money", content: [{ type: "heading", text: "Households → businesses → government → banks → back to households" }, { type: "body", text: "This loop is the blueprint of the entire economy. Understanding it shows where value leaks, where it accumulates, and where power concentrates. Every dollar you earn enters this loop." }, { type: "callout", text: "Banks sit at the center of this loop by design. Every transaction, every loan, every investment passes through the banking system — which extracts a fee at each point." }, { type: "vault", title: "VAULT SECRET: Position Yourself in the Flow", text: "The goal of sophisticated wealth building is to insert yourself into the circular flow as a recipient rather than just a participant. Rental income. Royalties. Interest. Dividends. Token distributions from real asset revenue." }, { type: "action", text: "Draw your personal circular flow. Where does money enter your life? Where does it exit? Where are you losing it to intermediaries?" }] }
    ],
    quiz: [
      { q: "The velocity of money refers to:", options: ["How fast you can withdraw from a bank", "How many times a dollar circulates through the economy", "The speed of wire transfers", "How quickly prices rise"], correct: 1 },
      { q: "Asymmetric information means:", options: ["Both parties know the same amount", "One party has more information and benefits from the gap", "Information spreads equally in free markets", "News travels faster online"], correct: 1 },
      { q: "Arbitrage is best described as:", options: ["Gambling on price movements", "Exploiting price or information gaps between markets", "Buying and holding long term", "Diversifying across asset classes"], correct: 1 },
      { q: "Opportunity cost is:", options: ["The fee charged for an investment", "The tax on capital gains", "The value of the next best alternative you gave up", "The total cost of ownership"], correct: 2 },
      { q: "An inelastic product or service is one where:", options: ["Demand disappears when price rises", "Demand holds steady even as price rises", "Supply increases when price rises", "Competition eliminates pricing power"], correct: 1 },
      { q: "The principal-agent problem occurs when:", options: ["Two businesses compete for the same customer", "The decision maker's incentives differ from those bearing the consequences", "A government regulates a private company", "An investor diversifies across asset classes"], correct: 1 },
      { q: "Animal spirits in economics refers to:", options: ["Commodity markets for livestock", "Human emotion and confidence driving market behavior", "Algorithmic trading systems", "Natural resource pricing"], correct: 1 },
      { q: "Marginal analysis focuses on:", options: ["The total cost of all past decisions", "The average return across a portfolio", "The cost and benefit of one additional unit", "Historical performance trends"], correct: 2 },
      { q: "The accelerator effect describes:", options: ["How inflation compounds over time", "How small demand increases trigger disproportionately large investment increases", "How interest rates affect bond prices", "How tax cuts stimulate consumer spending"], correct: 1 },
      { q: "The circular flow of money shows:", options: ["How cash is printed and distributed", "How value moves between households, businesses, government, and banks", "Why stock markets go up over time", "How trade deficits are calculated"], correct: 1 }
    ]
  },
  {
    id: 3, title: "Traditional Finance Systems", subtitle: "Know the game before you play it",
    icon: "🏦", tag: "SYSTEMS", duration: "50–65 min", xpReward: 500,
    lessons: [
      { title: "How Banks Really Work — Follow the Money", content: [{ type: "quote", text: "Banking was conceived in iniquity and born in sin.", author: "Josiah Stamp, Former President of the Bank of England" }, { type: "heading", text: "Fractional Reserve Banking" }, { type: "body", text: "Here is what your bank does with your deposit: it keeps a fraction as reserves and loans out the rest — often 10x what it actually holds. When you deposit $1,000, the bank may loan out $10,000 created from your deposit." }, { type: "callout", text: "Banks earn the spread: they pay you 0.5% on your savings and charge borrowers 7-25% on loans. The difference — your money, their profit. You are the product. Your deposits are their inventory." }, { type: "vault", title: "VAULT SECRET: Business Banking Strategy", text: "Never mix personal and business finances. Open a dedicated business checking account the moment you form an LLC. This creates legal separation, makes accounting cleaner, builds a banking relationship for future credit, and allows you to show business revenue history for loans." }, { type: "action", text: "Check your bank accounts: what interest are you earning? What fees are you paying? Calculate how much you've paid your bank in fees over the last 12 months." }] },
      { title: "Stocks, Bonds & Index Funds — The Honest Truth", content: [{ type: "quote", text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" }, { type: "heading", text: "Three categories — and what the wealthy actually do" }, { type: "body", text: "Stocks: fractional ownership of a company. Bonds: lending money to governments or corporations in exchange for interest. Index funds: diversified exposure to a market segment without picking individual stocks." }, { type: "callout", text: "Buffett publicly recommends low-cost S&P 500 index funds for most Americans. Yet the financial advisory industry makes billions selling actively managed funds that underperform the index 85% of the time — while charging 1-2% annual fees." }, { type: "vault", title: "VAULT SECRET: What the Wealthy Actually Hold", text: "The ultra-wealthy don't primarily build wealth through the stock market. They build it through ownership — of businesses, real estate, and intellectual property that generates cash flow. Stock market investments are often where they park excess capital." }, { type: "action", text: "Research: compare a target-date retirement fund's fees vs a Vanguard S&P 500 index fund over 30 years on $100,000. The difference will shock you." }] },
      { title: "Real Estate — The Wealth Machine They Can't Print More Of", content: [{ type: "quote", text: "Real estate cannot be lost or stolen, nor can it be carried away.", author: "Franklin D. Roosevelt" }, { type: "heading", text: "Four ways real estate builds wealth simultaneously" }, { type: "list", items: ["Cash Flow — rental income above all expenses", "Appreciation — values historically rise over time", "Loan Paydown — tenants effectively pay your mortgage", "Tax Advantages — depreciation, deductions, and deferrals"] }, { type: "callout", text: "The government incentivizes real estate ownership more than any other asset class. Knowing these incentives and using them is not cheating — it's what every wealthy real estate investor does by default." }, { type: "vault", title: "VAULT SECRET: 1031 Exchange & Cost Segregation", text: "A 1031 Exchange allows you to sell investment real estate and roll ALL proceeds into a new property — deferring capital gains taxes indefinitely. Cost segregation creates massive paper losses that offset real income. A $1M property might generate $150K+ in paper losses in year one. Legal. Used by every sophisticated real estate investor." }, { type: "action", text: "Research median rent prices in your city and compare to median mortgage payments on similar properties. Is there cash flow potential in your market?" }] },
      { title: "Retirement Accounts — The Hidden Power Most People Ignore", content: [{ type: "heading", text: "The government is actually on your side here" }, { type: "body", text: "This is one area where the system legitimately offers the average person a real advantage. 401(k), Traditional IRA, and Roth IRA accounts provide tax advantages that compound significantly over decades. Employer 401(k) matching is literally free money." }, { type: "callout", text: "The Roth IRA is arguably the most powerful wealth-building vehicle available to people under a certain income threshold. Money grows completely tax-free. Withdrawals in retirement are tax-free. No required minimum distributions." }, { type: "vault", title: "VAULT SECRET: Backdoor Roth & Roth Conversion Ladder", text: "High earners use the 'Backdoor Roth' — contributing to a Traditional IRA and immediately converting it. Completely legal. The Roth Conversion Ladder is used by early retirees to create a tax-free income stream in retirement." }, { type: "action", text: "Find out: does your employer offer a 401(k) match? Are you contributing enough to capture the full match? Calculate the exact dollar amount you are leaving on the table." }] },
      { title: "Credit — The Score That Controls Your Access to Capital", content: [{ type: "heading", text: "Credit is not debt. It's leverage." }, { type: "body", text: "Most people are taught to fear credit. The wealthy use it as a tool. A strong credit profile gives you access to capital at low interest rates — which means you can borrow money cheaply and deploy it into assets that return more than the cost of borrowing." }, { type: "callout", text: "Poor credit doesn't just cost you on loans. It costs you on car insurance, rental applications, security deposits, business partnerships. A low score is a tax on everything." }, { type: "vault", title: "VAULT SECRET: Business Credit is a Separate System", text: "Your personal credit and your business credit are two entirely separate profiles. A new LLC can begin building business credit through a DUNS number, net-30 vendor accounts, and a business credit card. Within 12-24 months, a properly structured business can access credit lines that have nothing to do with your personal SSN." }, { type: "action", text: "Pull your free credit report at AnnualCreditReport.com. Identify every negative item and look up the statute of limitations for removal in your state." }] },
      { title: "Comparing Wealth Paths — Employee vs Owner", content: [{ type: "quote", text: "The problem with the rat race is that even if you win, you're still a rat.", author: "Lily Tomlin" }, { type: "heading", text: "The system taxes labor. It subsidizes ownership." }, { type: "body", text: "W-2 employees pay income tax, Social Security tax, and Medicare tax — all before they spend a dollar. Business owners pay themselves after deducting legitimate business expenses and can access retirement contribution strategies unavailable to employees." }, { type: "callout", text: "An S-Corp owner can pay themselves a reasonable salary and take additional profit as distributions, which are not subject to self-employment tax. On $150,000 in business income, the difference vs W-2 can be $10,000-$20,000 annually." }, { type: "vault", title: "VAULT SECRET: The Solo 401(k) for Self-Employed", text: "A self-employed individual or LLC owner can contribute to a Solo 401(k) as BOTH employer and employee — up to $66,000+ annually (2024 limits). A W-2 employee is limited to $23,000 in contributions. Same income. Completely different outcome." }, { type: "action", text: "Calculate the difference in take-home pay between earning $100,000 as a W-2 employee vs a properly structured S-Corp owner in your state." }] }
    ],
    quiz: [
      { q: "Fractional reserve banking means:", options: ["Banks keep all deposits in a vault", "Banks loan out multiples of their actual deposits", "Banks only accept gold", "Banks are fully government-owned"], correct: 1 },
      { q: "A 1031 Exchange allows investors to:", options: ["Avoid all taxes permanently", "Defer capital gains by reinvesting into another property", "Sell stocks tax-free", "Access retirement funds early"], correct: 1 },
      { q: "An index fund is designed to:", options: ["Hold many investments in one fund", "Guarantee profits every year", "Replace all savings accounts", "Eliminate market risk entirely"], correct: 0 },
      { q: "The Roth IRA's main advantage is:", options: ["Tax-free growth and tax-free withdrawals in retirement", "Immediate tax deduction on contributions", "No contribution limits", "Guaranteed returns"], correct: 0 },
      { q: "Business credit differs from personal credit in that:", options: ["It doesn't exist", "It's a separate profile that doesn't require your SSN for all accounts", "It always requires personal guarantees", "It's only for corporations"], correct: 1 },
      { q: "An S-Corp salary structure can reduce taxes by:", options: ["Eliminating income tax entirely", "Allowing some profit to be taken as distributions not subject to self-employment tax", "Hiding income from the IRS", "Moving income offshore automatically"], correct: 1 },
      { q: "Which strategy can create large paper losses to offset real income in real estate?", options: ["Flipping houses", "Cost segregation", "Renting below market", "Paying cash for properties"], correct: 1 },
      { q: "The Backdoor Roth IRA is primarily used by:", options: ["People with no income", "High-income earners who exceed direct Roth contribution limits", "People under age 18", "Foreign nationals only"], correct: 1 },
      { q: "A Solo 401(k) allows self-employed individuals to contribute:", options: ["Only $6,000 annually", "As both employer and employee — up to $66,000+", "Nothing until age 50", "Only in gold"], correct: 1 },
      { q: "The tax code primarily rewards:", options: ["High-income W-2 employees", "Business ownership and investment income over labor income", "People who save cash", "Those who spend the most"], correct: 1 }
    ]
  },
  {
    id: 4, title: "Introduction to Crypto & Blockchain", subtitle: "The technology they couldn't contain",
    icon: "⛓", tag: "CRYPTO", duration: "55–70 min", xpReward: 500,
    lessons: [
      { title: "What Problem Does Blockchain Actually Solve?", content: [{ type: "quote", text: "Bitcoin is a remarkable cryptographic achievement.", author: "Eric Schmidt, Former Google CEO" }, { type: "heading", text: "The Trust Problem" }, { type: "body", text: "Every financial transaction you make is controlled by a middleman. Your bank approves or denies your wire. PayPal freezes your account. A government can freeze an entire banking system overnight. We saw this in Canada in 2022 when protesters had their accounts frozen without trial." }, { type: "callout", text: "Blockchain doesn't ask for permission. It runs on consensus — thousands of nodes validating every transaction simultaneously. To alter a transaction, you'd need to control 51% of the entire network simultaneously. That's the first truly trustless financial system in human history." }, { type: "vault", title: "VAULT SECRET: Why Governments Fear Bitcoin", text: "A central bank controls inflation, interest rates, and the money supply — the three most powerful economic levers in a nation. Bitcoin has a fixed supply of 21 million coins. No government, no board, no executive order can change this. For governments built on the power to print money, this is an existential threat." }, { type: "action", text: "Research: What happened to Cyprus bank depositors in 2013? What happened to Canadian truckers' bank accounts in 2022? Write what you find." }] },
      { title: "Bitcoin & Ethereum — Two Different Revolutions", content: [{ type: "quote", text: "Bitcoin is Gold 2.0.", author: "Tyler Winklevoss" }, { type: "heading", text: "Not all crypto is the same" }, { type: "body", text: "Bitcoin was designed as one thing: peer-to-peer electronic cash with a fixed supply. No CEO. No headquarters. No shutdown switch. Ethereum introduced programmability — smart contracts that execute automatically when conditions are met. No lawyers, no banks, no middlemen required to enforce agreements." }, { type: "callout", text: "Ethereum enabled an entire new financial system built on code — DeFi. Loans, exchanges, insurance, and yield — all operating without banks. In 2020-2021, DeFi grew from $1 billion to $100 billion in locked value in under 18 months." }, { type: "vault", title: "VAULT SECRET: What Institutions Are Buying", text: "MicroStrategy holds over 200,000 Bitcoin on its corporate balance sheet. BlackRock launched a Bitcoin ETF. El Salvador made Bitcoin legal tender. Institutions and sovereigns are quietly moving out of dollars and into hard assets. The retail investor is always the last to know." }, { type: "action", text: "Write one sentence describing Bitcoin and one sentence describing Ethereum in your own words." }] },
      { title: "Solana & Why Speed Matters for the New Economy", content: [{ type: "heading", text: "Not every blockchain optimizes the same way" }, { type: "body", text: "Bitcoin prioritizes security. Ethereum prioritizes programmability. Solana was built for throughput — 65,000 transactions per second, sub-second finality, fractions of a cent per transaction. For real-world adoption, speed matters enormously." }, { type: "callout", text: "Iron Vault Token is built on Solana. Fast settlement means distributions can flow to token holders automatically and immediately. Low fees mean small holders aren't priced out by transaction costs." }, { type: "vault", title: "VAULT SECRET: Puerto Rico Act 60", text: "If you establish residency in Puerto Rico and qualify under Act 60, your capital gains tax rate drops to 0%. Zero. Your crypto gains, your investment gains, realized after establishing bona fide residency — pay no federal capital gains tax and no Puerto Rico capital gains tax. This is a U.S. territory. The wealthy know about it." }, { type: "action", text: "Look up Solana's current transaction speed and cost vs Ethereum's. Then look up what Act 60 requires for qualification." }] },
      { title: "Wallets, Private Keys & Self-Custody", content: [{ type: "heading", text: "Not your keys. Not your coins." }, { type: "body", text: "When you keep crypto on an exchange, you don't own it — you own a claim on it. FTX had $32 billion in customer assets in 2022. In November of that year, customer withdrawals were frozen. The money was gone. Celsius, BlockFi — same story." }, { type: "callout", text: "Self-custody through a hardware wallet means the asset is mathematically yours. No platform can freeze it, lose it, or loan it out. The private key is the only thing that matters." }, { type: "vault", title: "VAULT SECRET: The Seed Phrase is Your Vault", text: "Your 12 or 24-word seed phrase is worth exactly as much as the assets secured by it. Do not photograph it. Do not store it digitally. Engrave it on steel. Store copies in separate physical locations. Trusts and estate planning can include crypto instructions." }, { type: "action", text: "Write three security habits you would follow before holding any crypto in self-custody." }] },
      { title: "What a Token Actually Is — And How to Evaluate One", content: [{ type: "heading", text: "Most tokens are worthless. A few change everything." }, { type: "body", text: "A token is a digital asset issued on a blockchain. The range is enormous — from Bitcoin backed by 15 years of security, to tokens created in minutes by anonymous developers that disappear overnight." }, { type: "list", items: ["Utility tokens: enable access or function within a system", "Governance tokens: grant voting rights over a protocol", "Stablecoins: designed to maintain stable value", "Asset-backed tokens: connected to real-world value (RWA)", "Meme/community tokens: driven by culture and speculation"] }, { type: "callout", text: "The question that separates sophisticated participants from gamblers: 'If price never moved, would this token still have value?' If the answer is no — it's speculation, not investment." }, { type: "action", text: "Pick two tokens. For each, answer: What does it do? Who uses it? Why does it need to be a token?" }] },
      { title: "Risks Everyone Ignores — Including the Ones You Can't See", content: [{ type: "quote", text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" }, { type: "heading", text: "The risks they tell you about — and the ones they don't" }, { type: "list", items: ["Market Risk — prices can move 80% in either direction rapidly", "Scam Risk — phishing, fake giveaways, rug pulls, impersonation", "Regulatory Risk — governments can restrict access, classify assets", "Technology Risk — exchange failures, smart contract exploits", "Emotional Risk — the most expensive and least discussed"] }, { type: "callout", text: "The emotional risk in crypto is categorically different from traditional markets because it never closes. 3am panic sells. Weekend manipulation. Holiday flash crashes. Your brain was not designed for this." }, { type: "vault", title: "VAULT SECRET: The Regulatory Playbook", text: "When governments can't stop a technology, they regulate it. Watch for: Classification — labeling tokens as securities. Taxation — treating every swap as a taxable event. Exchange licensing — restricting which exchanges can operate. None of this stops the underlying technology." }, { type: "action", text: "Write three personal rules you would follow before ever buying any digital asset." }] }
    ],
    quiz: [
      { q: "Blockchain technology primarily attempts to solve:", options: ["Making all investments risk-free", "The need to trust a central middleman for records and transfers", "Eliminating taxes worldwide", "Guaranteeing profits for users"], correct: 1 },
      { q: "What happened to FTX customer funds in November 2022?", options: ["They doubled in value", "Withdrawals were frozen and billions were lost", "They were transferred to Bitcoin", "The government reimbursed everyone"], correct: 1 },
      { q: "'Not your keys, not your coins' means:", options: ["You should change passwords frequently", "Crypto on exchanges is not truly yours until in self-custody", "Keys are required to open blockchain apps", "Bitcoin requires a physical key"], correct: 1 },
      { q: "Solana was selected for Iron Vault Token primarily because:", options: ["It's the cheapest blockchain to use", "It offers high speed and low fees suited for real-world asset distribution", "It has the most users globally", "It requires no regulation"], correct: 1 },
      { q: "Bitcoin's supply is fixed at:", options: ["100 million coins", "21 million coins", "1 billion coins", "It increases annually with inflation"], correct: 1 },
      { q: "Puerto Rico Act 60 can reduce capital gains tax to:", options: ["15%", "10%", "5%", "0%"], correct: 3 },
      { q: "A seed phrase should be:", options: ["Stored in a password manager app", "Photographed and saved to the cloud", "Engraved on steel and stored in multiple physical locations", "Shared with a trusted exchange for recovery"], correct: 2 },
      { q: "Which of the following is a common crypto risk many ignore?", options: ["Rug pulls and phishing scams", "Guaranteed monthly returns", "Government insurance on all wallets", "Automatic fraud reversal"], correct: 0 },
      { q: "The question that separates investment from speculation in tokens is:", options: ["Will the price go up?", "Does any influencer promote it?", "If price never moved, would this token still have value?", "Is it listed on Coinbase?"], correct: 2 },
      { q: "A responsible beginner approach to crypto is:", options: ["Borrow money to invest quickly", "Invest more than you can afford to lose", "Learn first and use only risk capital if participating", "Buy based only on hype"], correct: 2 }
    ]
  },
  {
    id: 5, title: "Digital Assets & Modern Wealth", subtitle: "The strategies they keep to themselves",
    icon: "⚡", tag: "STRATEGY", duration: "50–65 min", xpReward: 500,
    lessons: [
      { title: "Stablecoins & Real-World Asset Backing", content: [{ type: "heading", text: "Stability in a volatile world" }, { type: "body", text: "Stablecoins are digital assets designed to maintain a stable value — usually pegged to the U.S. dollar. They allow you to move money globally in seconds, earn yield on-chain, and settle transactions without cryptocurrency volatility." }, { type: "list", items: ["Cash-backed (USDC, USDT) — dollar reserves held by a custodian", "Government security-backed — short-term treasuries as collateral", "Crypto-overcollateralized (DAI) — crypto reserves exceeding the issued value", "Algorithmic (historically high-risk — see Terra/Luna 2022)"] }, { type: "callout", text: "Real-World Asset (RWA) tokens go further — connecting on-chain digital tokens directly to real estate, bonds, invoices, or other physical assets. This is the bridge between traditional finance and decentralized infrastructure. It's where Iron Vault operates." }, { type: "vault", title: "VAULT SECRET: Yield on Stablecoins", text: "While your bank pays 0.01% on savings, DeFi protocols currently offer 4-8% APY on stablecoin deposits. Platforms like Aave and Compound allow you to lend stablecoins to borrowers who over-collateralize with crypto. The yield differential is real and significant." }, { type: "action", text: "Research one stablecoin. Write how it maintains its peg, what backs it, and what risks exist if that backing fails." }] },
      { title: "Revenue-Sharing Models & How to Evaluate Them", content: [{ type: "heading", text: "When tokens share real economics — and when they're lying" }, { type: "body", text: "Some token ecosystems distribute a portion of real platform revenue to holders — through fee sharing, staking rewards, treasury distributions, or asset-generated income. These models can be powerful when real economics exist." }, { type: "callout", text: "The critical question: Where does the money actually come from? If the answer is 'new investor deposits' — that's not revenue sharing. That's a Ponzi structure. Real revenue comes from external economic activity." }, { type: "vault", title: "VAULT SECRET: The LLC + On-Chain Income Structure", text: "Sophisticated Web3 operators structure their token income through LLCs, receive distributions as business income, and deploy that capital into additional assets. Business income has deductions available that personal income does not." }, { type: "action", text: "Write the difference between 'real revenue' and 'speculative hype' in your own words. Then apply that test to three projects you've heard of." }] },
      { title: "Token Utility vs Speculation — Know What You're Buying", content: [{ type: "heading", text: "Utility makes assets. Speculation makes bubbles." }, { type: "body", text: "Utility means a token enables something real — access, payments, governance, fee reduction, network usage. Speculation means buying because you expect someone else to pay more later." }, { type: "callout", text: "A useful diagnostic: if the team disappeared tomorrow, would the token still have value? Strong utility tokens power systems that exist independent of any team." }, { type: "vault", title: "VAULT SECRET: The Accredited Investor Wall", text: "The most lucrative investment opportunities are legally restricted to 'accredited investors.' Tokenization is starting to break this wall. Real estate syndications on-chain with $500 minimums. Private credit accessible to retail. The democratization is real." }, { type: "action", text: "Choose one token. List every use case you can verify. If speculation is the only story, write that honestly." }] },
      { title: "The Infinite Banking Concept — How the Wealthy Use Life Insurance", content: [{ type: "quote", text: "The greatest financial secret of the wealthy is not stocks or real estate. It's cash value life insurance.", author: "Nelson Nash, Becoming Your Own Banker" }, { type: "heading", text: "This is the play most financial advisors won't explain" }, { type: "body", text: "A properly structured Indexed Universal Life (IUL) or Whole Life insurance policy builds cash value over time. That cash value is an asset you can borrow against at low interest rates. The loan is not taxable income." }, { type: "callout", text: "The structure: You fund the policy aggressively. Cash value grows tax-deferred. You borrow against cash value to invest in real estate or business. Cash flow from those assets repays the loan. Your policy keeps compounding. Repeat." }, { type: "vault", title: "VAULT SECRET: The Trust + Life Insurance Strategy", text: "Place a $1M+ life insurance policy inside an Irrevocable Life Insurance Trust (ILIT). The trust owns the policy. The death benefit passes to heirs completely outside your estate, avoiding estate taxes. The trust can borrow against the cash value during your lifetime." }, { type: "action", text: "Research: What is an Irrevocable Life Insurance Trust (ILIT)? Write how it differs from owning a life insurance policy personally." }] },
      { title: "Tax Strategy — Legal Structures the Wealthy Actually Use", content: [{ type: "quote", text: "The avoidance of taxes is the only intellectual pursuit that carries any reward.", author: "John Maynard Keynes" }, { type: "heading", text: "Tax avoidance is legal. Tax evasion is not. Know the difference." }, { type: "body", text: "The U.S. tax code taxes different types of income at radically different rates. W-2 wages can be taxed up to 37% federal. Long-term capital gains are taxed at 0%, 15%, or 20%. The system is not neutral." }, { type: "callout", text: "The U.S. tax code taxes different types of income at radically different rates. W-2 wages can be taxed up to 37% federal. Long-term capital gains are taxed at 0%, 15%, or 20%. The system was designed with winners in mind." }, { type: "vault", title: "VAULT SECRET: The 'On-Paper-Broke' LLC Strategy", text: "A legitimately operating LLC can receive business income while the owner takes a modest personal salary. The LLC pays for business expenses — reducing taxable income. When personal income is low enough, the individual may qualify for certain tax credits and income-tested programs — all while the LLC holds and builds assets." }, { type: "action", text: "Research: What is the difference between a Schedule C sole proprietorship, an LLC, and an S-Corp? Write the tax treatment differences for each." }] },
      { title: "Building a Sustainable Strategy — Process Over Prediction", content: [{ type: "quote", text: "Compound interest is the eighth wonder of the world. He who understands it, earns it. He who doesn't, pays it.", author: "Albert Einstein (attributed)" }, { type: "heading", text: "A sustainable strategy looks boring from the outside" }, { type: "list", items: ["Learn deeply before committing capital", "Build the entity structure before building the portfolio", "Use only risk capital — money you could lose without crisis", "Dollar-cost average into volatile assets over time", "Diversify across asset classes, not just within crypto", "Hold for long enough to let compounding work", "Review quarterly — not daily"] }, { type: "callout", text: "The enemy of wealth is not the tax man or the market. It's impatience. The people who lost the most in every crash were those who needed the money tomorrow." }, { type: "vault", title: "VAULT SECRET: The Portfolio of the Informed", text: "A sophisticated participant in 2025 might hold: cash flow real estate (core wealth engine), index funds (passive market exposure), a small Bitcoin position (hard money hedge), a small allocation to tokenized RWA (asymmetric upside), and permanent life insurance cash value (tax-free growth, leverage vehicle)." }, { type: "action", text: "Write three personal rules your future self would thank you for. Make them behavioral — not about returns, about process." }] }
    ],
    quiz: [
      { q: "A stablecoin is generally designed to:", options: ["Increase in price every month", "Maintain a relatively stable value", "Replace all stocks permanently", "Eliminate taxes"], correct: 1 },
      { q: "The Infinite Banking Concept involves:", options: ["Hiding money in Swiss accounts", "Using life insurance cash value as a personal borrowing facility", "Investing only in index funds", "Opening multiple checking accounts"], correct: 1 },
      { q: "An Irrevocable Life Insurance Trust (ILIT) primarily benefits heirs by:", options: ["Paying them monthly during your lifetime", "Passing death benefits outside the taxable estate", "Replacing a will", "Providing government matching funds"], correct: 1 },
      { q: "The 'on-paper-broke' LLC strategy works because:", options: ["It hides income illegally", "The LLC legitimately receives income and deducts business expenses, reducing personal taxable income", "LLCs don't pay taxes ever", "Only applies to corporations"], correct: 1 },
      { q: "Token utility means the token provides:", options: ["Guaranteed profits", "Access or function within an ecosystem independent of price", "Automatic government insurance", "Free tax refunds"], correct: 1 },
      { q: "The Accredited Investor standard historically excludes regular people from:", options: ["Opening bank accounts", "The most lucrative private investment opportunities", "Buying public stocks", "Filing taxes"], correct: 1 },
      { q: "Long-term capital gains are taxed compared to W-2 wages:", options: ["At identical rates", "At significantly lower rates", "At higher rates", "They are not taxed at all"], correct: 1 },
      { q: "Why is the Roth IRA powerful for wealth building?", options: ["Contributions are tax-deductible", "Growth and qualifying withdrawals are completely tax-free", "It has no contribution limits", "It guarantees returns"], correct: 1 },
      { q: "In the Buy, Borrow, Die strategy, borrowing against assets is advantageous because:", options: ["Loans carry zero interest", "Loan proceeds are not taxable income", "It eliminates estate taxes automatically", "Banks are required to approve these loans"], correct: 1 },
      { q: "A sustainable crypto strategy primarily emphasizes:", options: ["Borrowing heavily and trading emotionally", "Learning first, building structure, and using only risk capital", "Buying every trending asset immediately", "Relying on tips from social media"], correct: 1 }
    ]
  },
  {
    id: 6, title: "The Iron Vault System", subtitle: "Why we built this. What comes next.",
    icon: "🛡", tag: "IRON VAULT", duration: "45–60 min", xpReward: 500,
    lessons: [
      { title: "The Iron Vault 3-Phase Vision", content: [{ type: "quote", text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" }, { type: "heading", text: "Phase 1 — Community & Education (Now)" }, { type: "body", text: "Before a single token is sold at scale, the community must understand what they're participating in. Iron Vault inverts the model. Education is the product. The token is the reward for being informed." }, { type: "heading", text: "Phase 2 — Real Asset Acquisition & Revenue" }, { type: "body", text: "Income-producing real-world assets — real estate and related opportunities — provide the economic engine. Rental income, appreciation, and cash flow from physical assets tied to digital infrastructure." }, { type: "heading", text: "Phase 3 — Digital Infrastructure Expansion" }, { type: "body", text: "Additional financial tools, expanded token utility, and asset-linked digital products — if legally and operationally viable. The roadmap is phased deliberately. Foundation first. Expansion when earned." }, { type: "callout", text: "A phased model is the opposite of how most projects are marketed. No promises of instant returns. No manufactured urgency. The community that understands the system is the asset." }, { type: "action", text: "Write which phase you believe creates the most long-term value — and defend your reasoning." }] },
      { title: "How Real Assets Connect to Digital Systems", content: [{ type: "heading", text: "Real substance + digital efficiency = the actual opportunity" }, { type: "body", text: "Traditional real estate is powerful but slow. Buying takes months. Selling takes months. Blockchain changes all of this." }, { type: "callout", text: "A smart contract can hold rental income and distribute it proportionally to token holders within seconds of receipt — automatically, transparently, and without a third party taking a cut." }, { type: "vault", title: "VAULT SECRET: How Iron Vault's Smart Contracts Work", text: "Iron Vault's distribution mechanism receives income from real-world asset activity and allocates it according to token holdings recorded on-chain. When the contract triggers, it reads token balances, calculates proportional shares, and executes distributions — without manual intervention, without a bank transfer. Every distribution is publicly verifiable on the Solana blockchain." }, { type: "action", text: "Name one real-world asset class that would benefit most from automated, transparent distribution infrastructure." }] },
      { title: "Why Education-First Is Actually the Strategy", content: [{ type: "quote", text: "The man who does not read has no advantage over the man who cannot read.", author: "Mark Twain" }, { type: "heading", text: "Uninformed money is emotional money — and emotional money is exploitable" }, { type: "body", text: "The history of financial markets is a history of the informed transferring wealth from the uninformed during moments of fear and greed." }, { type: "callout", text: "An educated community doesn't panic. Educated participants ask better questions. They recognize manipulation, evaluate claims independently, and hold through volatility because they understand what they own." }, { type: "body", text: "This is why you're here. This is why this course exists before the token launch. Not as marketing. As infrastructure." }, { type: "action", text: "Write one thing you understand now that you didn't before this course. Be specific." }] },
      { title: "Risks, Disclosures & Eyes Wide Open", content: [{ type: "heading", text: "Every opportunity carries real risk. Honesty here is non-negotiable." }, { type: "list", items: ["Market Risk — token value can decline significantly and rapidly", "Execution Risk — plans may delay, underperform, or change", "Regulatory Risk — laws governing digital assets continue to evolve", "Liquidity Risk — buying or selling may be difficult in certain market conditions", "Technology Risk — smart contract bugs, network outages, wallet vulnerabilities", "Team Risk — execution depends on human performance"] }, { type: "callout", text: "There are no guarantees. Not of returns, not of appreciation, not of success. Anyone who tells you otherwise is either uninformed or dishonest." }, { type: "body", text: "A mature participant asks: What can go wrong? — before asking: What if this works? If you cannot answer the first question, you are not ready to participate." }, { type: "action", text: "Write the top three risks that concern you personally. Then write how you would manage each one before committing capital." }] },
      { title: "What You Do After This Course", content: [{ type: "heading", text: "Knowledge without action is expensive entertainment" }, { type: "list", items: ["Step 1: Pause. Do not make emotional decisions because you feel motivated.", "Step 2: Organize your financial foundation — emergency fund, debt plan, basic budget.", "Step 3: Evaluate your entity structure. Do you have an LLC? Should you?", "Step 4: If participating in digital assets — learn self-custody first.", "Step 5: Continue learning. This course is a starting point, not a destination."] }, { type: "callout", text: "The gap between knowing and doing is where most people stay permanently. The people who act on what they learn — even imperfectly — are the ones who look back in five years grateful they started." }, { type: "vault", title: "VAULT SECRET: The First Move Most People Skip", text: "Before you buy your first investment, open a business checking account under an LLC. Before that, form the LLC ($50-200 in most states). Before that, get an EIN from the IRS (free, takes 5 minutes online). These three steps create the legal separation that protects your personal assets, opens business credit, and enables business deductions." }, { type: "action", text: "Write a 30-day action plan. Include at least one concrete structural move — not just 'save money.'" }] },
      { title: "Completion — What You Now Know That Most People Don't", content: [{ type: "quote", text: "The first step to getting the things you want out of life is this: Decide what you want.", author: "Ben Stein" }, { type: "heading", text: "You have crossed a threshold most people never approach" }, { type: "body", text: "Most people will spend their entire lives inside a financial system they don't understand, paying taxes they don't have to, building wealth they never reach. They weren't lazy. They weren't stupid. They were never taught." }, { type: "callout", text: "You now know: how money is created and debased. How the tax code rewards ownership over labor. How entities separate your personal exposure from your financial activity. How real assets connect to digital infrastructure. How to evaluate an opportunity without being manipulated." }, { type: "body", text: "The system was designed by people who understood it, for people who didn't. You've closed that gap. Use it wisely, patiently, and with full awareness of the risks." }, { type: "action", text: "Answer: What belief about money changed most? What action will you take in the next 7 days? What mistake will you now avoid?" }] }
    ],
    quiz: [
      { q: "Iron Vault's Phase 1 focuses on:", options: ["Immediate token launch and sales", "Community building and education before scale", "Eliminating all financial intermediaries", "Guaranteed monthly distributions"], correct: 1 },
      { q: "Iron Vault's smart contracts are built on:", options: ["Ethereum", "Bitcoin", "Solana", "Cardano"], correct: 2 },
      { q: "Real-world asset tokenization can improve:", options: ["Only marketing optics", "Transparency, distribution speed, and accessibility", "Nothing that traditional finance can't already do", "Government tax collection"], correct: 1 },
      { q: "An education-first model benefits the community by:", options: ["Guaranteeing profits for early participants", "Creating panic-resistant, informed participants less susceptible to manipulation", "Replacing all legal disclosures", "Removing all investment risk"], correct: 1 },
      { q: "Which of the following is a real risk Iron Vault discloses?", options: ["Execution delays and regulatory changes", "Guaranteed upside only", "Automatic liquidity always available", "No downside exists"], correct: 0 },
      { q: "The first structural financial move most people skip is:", options: ["Buying Bitcoin immediately", "Forming an LLC and opening a business checking account", "Moving to Puerto Rico", "Buying a rental property"], correct: 1 },
      { q: "Financial literacy is best viewed as:", options: ["A one-time certificate to earn", "An ongoing, lifelong strategic advantage", "Something only relevant if you're wealthy", "Unrelated to everyday decisions"], correct: 1 },
      { q: "Smart contract distributions are advantageous because:", options: ["They require bank approval to process", "They execute automatically, proportionally, and publicly on-chain", "They are only accessible to accredited investors", "They eliminate all tax obligations"], correct: 1 },
      { q: "There are guarantees of returns, success, or appreciation in Iron Vault:", options: ["Yes, as stated in the smart contract", "Only for members", "No — participation involves real risk", "Yes, backed by government insurance"], correct: 2 },
      { q: "The appropriate mindset after completing this course is:", options: ["Rush into all available investment opportunities immediately", "Share nothing — information is power to keep private", "Apply knowledge deliberately, structurally, and with full awareness of risk", "Wait until the market is perfect before acting"], correct: 2 }
    ]
  },
  ...EDUCATION_ONLY_MODULES
];

const PASS_SCORE = 8;
const TOTAL_XP = MODULES.reduce((s, m) => s + m.xpReward, 0);
const FULL_CURRICULUM_MODULE_IDS = MODULES.map((module) => module.id);

function getModuleArrayIndex(moduleId) {
  return MODULES.findIndex((module) => module.id === moduleId);
}

function createShuffledQuiz(quiz) {
  return quiz.map((question) => {
    const choices = question.options.map((text, index) => ({
      text,
      isCorrect: index === question.correct,
    }));

    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return {
      ...question,
      options: choices.map((choice) => choice.text),
      correct: choices.findIndex((choice) => choice.isCorrect),
    };
  });
}

function createEmptyProgress() {
  return MODULES.map(() => ({ done: new Set(), score: null, passed: false }));
}

function hydrateProgress(payload) {
  const next = createEmptyProgress();
  const lessons = Array.isArray(payload?.lessons) ? payload.lessons : [];
  const quizResults = Array.isArray(payload?.quizResults) ? payload.quizResults : [];

  for (const lesson of lessons) {
    const moduleIndex = getModuleArrayIndex(Number(lesson?.module_index));
    const lessonIndex = Number(lesson?.lesson_index);
    if (Number.isInteger(moduleIndex) && Number.isInteger(lessonIndex) && next[moduleIndex]) {
      next[moduleIndex].done.add(lessonIndex);
    }
  }

  for (const quiz of quizResults) {
    const moduleIndex = getModuleArrayIndex(Number(quiz?.module_index));
    if (!Number.isInteger(moduleIndex) || !next[moduleIndex]) continue;
    next[moduleIndex].score = Number.isInteger(quiz?.score) ? quiz.score : null;
    next[moduleIndex].passed = Boolean(quiz?.passed);
  }

  return next;
}

// ─── STYLES (identical to gated variant) ───────────────────────────────────
const CSS = `
  ${FONTS}
  *{box-sizing:border-box;margin:0;padding:0;}
  .iv{min-height:100vh;background:#080808;color:#E8E8E8;font-family:'DM Sans',sans-serif;position:relative;overflow-x:hidden;}
  .iv::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(123,47,190,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(123,47,190,0.04) 1px,transparent 1px);background-size:80px 80px;pointer-events:none;z-index:0;}
  .iv::after{content:'';position:fixed;top:-300px;right:-300px;width:800px;height:800px;background:radial-gradient(circle,rgba(123,47,190,0.08) 0%,transparent 70%);pointer-events:none;z-index:0;}
  .iv-header{background:#0F0F0F;border-bottom:1px solid #1A1A1A;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:60px;position:sticky;top:0;z-index:100;}
  .iv-logo{display:flex;align-items:center;gap:10px;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;color:#fff;}
  .iv-dot{width:10px;height:10px;background:#AAFF00;border-radius:50%;box-shadow:0 0 12px #AAFF00;animation:glow 2s infinite;}
  .iv-xp-wrap{display:flex;align-items:center;gap:12px;}
  .iv-xp-label{font-family:'Space Mono',monospace;font-size:10px;color:#555;letter-spacing:1px;}
  .iv-xp-track{width:140px;height:3px;background:#1A1A1A;border-radius:2px;overflow:hidden;}
  .iv-xp-fill{height:100%;background:linear-gradient(90deg,#7B2FBE,#AAFF00);transition:width 0.8s ease;box-shadow:0 0 8px rgba(170,255,0,0.3);}
  .iv-xp-val{font-family:'Space Mono',monospace;font-size:12px;color:#AAFF00;font-weight:700;}
  .iv-chip{display:flex;align-items:center;gap:8px;background:#141414;border:1px solid #1E1E1E;border-radius:20px;padding:5px 14px;font-size:12px;color:#555;cursor:pointer;transition:all 0.2s;}
  .iv-chip:hover{border-color:#7B2FBE;color:#fff;}
  /* ── MEMBER BANNER ── */
  .iv-member-banner{background:linear-gradient(90deg,rgba(170,255,0,0.08),rgba(123,47,190,0.08));border-bottom:1px solid rgba(170,255,0,0.15);padding:10px 28px;display:flex;align-items:center;justify-content:center;gap:12px;}
  .iv-member-banner span{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#AAFF00;}
  .iv-hub{min-height:100vh;position:relative;z-index:1;}
  .iv-wrap{max-width:1080px;margin:0 auto;padding:44px 28px;}
  .iv-eyebrow{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:3px;color:#AAFF00;margin-bottom:10px;}
  .iv-h1{font-family:'Bebas Neue',sans-serif;font-size:52px;line-height:1;letter-spacing:2px;color:#fff;margin-bottom:10px;}
  .iv-sub{font-size:14px;color:#555;line-height:1.6;max-width:460px;margin-bottom:40px;}
  .iv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:44px;}
  .iv-stat{background:#0F0F0F;border:1px solid #1A1A1A;border-radius:4px;padding:18px;position:relative;overflow:hidden;}
  .iv-stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(170,255,0,0.15),transparent);}
  .iv-stat-l{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:2px;color:#444;margin-bottom:8px;}
  .iv-stat-v{font-family:'Bebas Neue',sans-serif;font-size:34px;color:#AAFF00;line-height:1;}
  .iv-stat-u{font-family:'Space Mono',monospace;font-size:9px;color:#444;margin-top:4px;}
  .iv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
  .iv-card{background:#0F0F0F;border:1px solid #1A1A1A;border-radius:4px;padding:24px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;animation:fadeUp 0.4s ease both;}
  .iv-card.free{border-color:rgba(201,162,39,0.55);box-shadow:0 0 32px rgba(170,255,0,0.08),inset 0 0 0 1px rgba(170,255,0,0.08);}
  .iv-card.free::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#C9A227,#AAFF00,#7B2FBE);}
  .iv-card.free .iv-icon{background:rgba(201,162,39,0.14);border-color:rgba(201,162,39,0.45);}
  .iv-card.free .iv-card-tag{color:#C9A227;}
  .iv-card:hover:not(.locked){border-color:rgba(123,47,190,0.5);transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.5);}
  .iv-card.free:hover:not(.locked){border-color:rgba(170,255,0,0.65);box-shadow:0 12px 40px rgba(170,255,0,0.10);}
  .iv-card.locked{opacity:0.35;cursor:not-allowed;}
  .iv-card.passed{border-color:rgba(170,255,0,0.2);}
  .iv-card:not(.locked):not(.passed):not(.free)::before,.iv-card.passed:not(.free)::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
  .iv-card:not(.locked):not(.passed):not(.free)::before{background:linear-gradient(90deg,transparent,#7B2FBE,transparent);}
  .iv-card.passed::before{background:linear-gradient(90deg,transparent,#AAFF00,transparent);}
  .iv-card-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;}
  .iv-icon{width:44px;height:44px;background:rgba(123,47,190,0.15);border:1px solid rgba(123,47,190,0.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;}
  .iv-badge{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:2px;padding:4px 10px;border-radius:2px;}
  .b-lock{color:#333;background:#141414;}
  .b-avail{color:#AAFF00;background:rgba(170,255,0,0.08);border:1px solid rgba(170,255,0,0.2);}
  .b-prog{color:#7B2FBE;background:rgba(123,47,190,0.1);border:1px solid rgba(123,47,190,0.3);}
  .b-pass{color:#AAFF00;background:rgba(170,255,0,0.1);border:1px solid rgba(170,255,0,0.3);}
  .iv-prog-bar{height:2px;background:#1A1A1A;border-radius:1px;margin-bottom:14px;overflow:hidden;}
  .iv-prog-fill{height:100%;background:linear-gradient(90deg,#7B2FBE,#AAFF00);transition:width 0.5s;}
  .iv-prog-fill.green{background:linear-gradient(90deg,#AAFF00,#88FF44);}
  .iv-card-tag{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:2px;color:#7B2FBE;margin-bottom:5px;}
  .iv-card-title{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#fff;margin-bottom:5px;line-height:1.1;}
  .iv-card-sub{font-size:12px;color:#444;line-height:1.5;margin-bottom:16px;}
  .iv-card-ft{display:flex;align-items:center;gap:14px;padding-top:14px;border-top:1px solid #141414;}
  .iv-meta{font-family:'Space Mono',monospace;font-size:9px;color:#444;}
  .iv-meta span{color:#666;}
  .iv-page{max-width:860px;margin:0 auto;padding:44px 28px;}
  .iv-back{display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid #1E1E1E;border-radius:2px;padding:9px 18px;color:#555;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;transition:all 0.2s;margin-bottom:28px;}
  .iv-back:hover{border-color:#7B2FBE;color:#AAFF00;}
  .iv-lessons{display:flex;flex-direction:column;gap:10px;margin-bottom:24px;}
  .iv-lesson-row{background:#0F0F0F;border:1px solid #1A1A1A;border-radius:4px;padding:18px 22px;display:flex;align-items:center;gap:18px;cursor:pointer;transition:all 0.2s;}
  .iv-lesson-row:hover:not(.l-locked){border-color:rgba(123,47,190,0.4);}
  .iv-lesson-row.l-locked{opacity:0.35;cursor:not-allowed;}
  .iv-ln{font-family:'Space Mono',monospace;font-size:11px;color:#444;min-width:28px;}
  .iv-lt{flex:1;font-size:14px;color:#E8E8E8;font-weight:500;}
  .iv-lc{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}
  .lc-done{background:rgba(170,255,0,0.1);color:#AAFF00;border:1px solid rgba(170,255,0,0.3);}
  .lc-avail{background:rgba(123,47,190,0.1);color:#7B2FBE;border:1px solid rgba(123,47,190,0.3);}
  .lc-pend{background:#141414;color:#333;border:1px solid #1E1E1E;}
  .iv-quiz-box{background:#0F0F0F;border:1px solid rgba(170,255,0,0.15);border-radius:4px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
  .iv-quiz-box.locked{opacity:0.35;}
  .iv-quiz-box h3{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#fff;margin-bottom:3px;}
  .iv-quiz-box p{font-size:12px;color:#444;}
  .iv-quiz-box .pass{color:#AAFF00;margin-top:3px;}
  .iv-qbtn{background:#AAFF00;border:none;border-radius:3px;padding:12px 26px;color:#080808;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;white-space:nowrap;flex-shrink:0;}
  .iv-qbtn:hover{background:#BFFF33;}
  .iv-qbtn:disabled{opacity:0.4;cursor:not-allowed;}
  .iv-lesson-view{max-width:740px;margin:0 auto;padding:44px 28px;position:relative;z-index:1;}
  .iv-lesson-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px;}
  .iv-lesson-ctr{font-family:'Space Mono',monospace;font-size:10px;color:#444;}
  .iv-lesson-hd{margin-bottom:32px;}
  .iv-lesson-tag{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#7B2FBE;margin-bottom:8px;}
  .iv-lesson-title{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;color:#fff;line-height:1.1;}
  .iv-body-stack{display:flex;flex-direction:column;gap:22px;margin-bottom:36px;}
  .c-quote{border-left:3px solid #7B2FBE;padding:16px 20px;background:rgba(123,47,190,0.04);border-radius:0 4px 4px 0;}
  .c-quote blockquote{font-size:15px;color:#B8A8D8;font-style:italic;line-height:1.7;margin-bottom:8px;}
  .c-quote cite{font-family:'Space Mono',monospace;font-size:9px;color:#7B2FBE;letter-spacing:1px;}
  .c-heading{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;color:#fff;border-left:3px solid #AAFF00;padding-left:14px;}
  .c-body{font-size:14px;color:#777;line-height:1.85;}
  .c-callout{background:rgba(170,255,0,0.04);border-left:3px solid #AAFF00;border-radius:0 4px 4px 0;padding:16px 20px;font-size:14px;color:#AAD870;line-height:1.7;}
  .c-list{display:flex;flex-direction:column;gap:10px;}
  .c-list-item{display:flex;align-items:flex-start;gap:12px;font-size:14px;color:#777;line-height:1.6;}
  .c-list-item::before{content:'▸';color:#7B2FBE;flex-shrink:0;margin-top:2px;}
  .c-action{background:rgba(123,47,190,0.06);border:1px solid rgba(123,47,190,0.2);border-radius:4px;padding:16px 18px;display:flex;gap:12px;align-items:flex-start;}
  .c-action-label{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:2px;color:#7B2FBE;flex-shrink:0;margin-top:2px;}
  .c-action-text{font-size:13px;color:#7B2FBE;line-height:1.6;}
  .c-vault{background:rgba(201,162,39,0.05);border:1px solid rgba(201,162,39,0.25);border-radius:4px;padding:20px;position:relative;overflow:hidden;}
  .c-vault::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#C9A227,transparent);}
  .c-vault-label{display:flex;align-items:center;gap:8px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#C9A227;margin-bottom:12px;}
  .c-vault-title{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:#C9A227;}
  .c-vault-text{font-size:13px;color:#A08830;line-height:1.75;}
  .iv-lesson-footer{display:flex;justify-content:flex-end;padding-top:20px;border-top:1px solid #141414;}
  .iv-quiz-view{max-width:740px;margin:0 auto;padding:44px 28px;position:relative;z-index:1;}
  .iv-q-prog-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .iv-q-prog-label{font-family:'Space Mono',monospace;font-size:10px;color:#444;}
  .iv-q-prog-track{height:2px;background:#1A1A1A;border-radius:1px;overflow:hidden;margin-bottom:28px;}
  .iv-q-prog-fill{height:100%;background:linear-gradient(90deg,#7B2FBE,#AAFF00);transition:width 0.3s;}
  .iv-q-card{background:#0F0F0F;border:1px solid #1A1A1A;border-radius:4px;padding:28px;margin-bottom:20px;animation:fadeUp 0.25s ease;}
  .iv-q-num{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;color:#7B2FBE;margin-bottom:14px;}
  .iv-q-text{font-size:17px;font-weight:600;color:#fff;line-height:1.5;margin-bottom:24px;}
  .iv-opts{display:flex;flex-direction:column;gap:10px;}
  .iv-opt{background:#080808;border:1px solid #1E1E1E;border-radius:4px;padding:14px 18px;cursor:pointer;font-size:13px;color:#666;text-align:left;transition:all 0.2s;display:flex;align-items:center;gap:14px;}
  .iv-opt:hover:not(.sel):not(.dis){border-color:rgba(123,47,190,0.4);color:#E8E8E8;}
  .iv-opt.sel{border-color:#7B2FBE;background:rgba(123,47,190,0.08);color:#E8E8E8;}
  .iv-opt.correct{border-color:#AAFF00!important;background:rgba(170,255,0,0.06)!important;color:#AAFF00!important;}
  .iv-opt.wrong{border-color:#EF4444!important;background:rgba(239,68,68,0.06)!important;color:#EF4444!important;}
  .iv-opt.dis{cursor:default;}
  .iv-opt-l{font-family:'Space Mono',monospace;font-size:10px;width:22px;height:22px;border-radius:2px;background:#141414;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#444;transition:all 0.2s;}
  .iv-opt.sel .iv-opt-l{background:#7B2FBE;color:#fff;}
  .iv-opt.correct .iv-opt-l{background:#AAFF00;color:#080808;}
  .iv-opt.wrong .iv-opt-l{background:#EF4444;color:#fff;}
  .iv-q-footer{display:flex;justify-content:space-between;align-items:center;}
  .iv-q-score{font-family:'Space Mono',monospace;font-size:11px;color:#444;}
  .iv-results{max-width:600px;margin:0 auto;padding:64px 28px;text-align:center;position:relative;z-index:1;animation:fadeUp 0.4s ease;}
  .iv-results-icon{font-size:60px;margin-bottom:16px;display:block;}
  .iv-results-score{font-family:'Bebas Neue',sans-serif;font-size:88px;line-height:1;margin-bottom:6px;}
  .rs-pass{color:#AAFF00;text-shadow:0 0 30px rgba(170,255,0,0.3);}
  .rs-fail{color:#EF4444;}
  .iv-results-title{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:#fff;margin-bottom:10px;}
  .iv-results-sub{font-size:14px;color:#555;max-width:380px;margin:0 auto 28px;line-height:1.6;}
  .iv-results-xp{display:inline-flex;align-items:center;gap:10px;background:rgba(170,255,0,0.08);border:1px solid rgba(170,255,0,0.2);border-radius:4px;padding:12px 24px;margin-bottom:28px;font-family:'Space Mono',monospace;font-size:13px;color:#AAFF00;}
  .iv-results-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .iv-btn-lime{background:#AAFF00;border:none;border-radius:3px;padding:14px 28px;color:#080808;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;}
  .iv-btn-lime:hover{background:#BFFF33;}
  .iv-btn-ghost{background:none;border:1px solid #2A2A2A;color:#888;border-radius:3px;padding:12px 24px;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:2px;cursor:pointer;transition:all 0.2s;}
  .iv-btn-ghost:hover{border-color:#7B2FBE;color:#7B2FBE;}
  .confetti-piece{position:fixed;width:8px;height:8px;animation:fall linear both;z-index:999;pointer-events:none;}
  @keyframes fall{0%{transform:translateY(-10px) rotate(0);opacity:1;}100%{transform:translateY(100vh) rotate(720deg);opacity:0;}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px #AAFF00;}50%{box-shadow:0 0 20px #AAFF00;}}
  @media(max-width:768px){
    .iv-stats{grid-template-columns:repeat(2,1fr);}
    .iv-header{padding:0 16px;}
    .iv-wrap,.iv-page,.iv-lesson-view,.iv-quiz-view{padding:28px 16px;}
    .iv-h1{font-size:38px;}
    .iv-xp-track{width:80px;}
    .iv-chip{display:none;}
    .iv-quiz-box{flex-direction:column;align-items:flex-start;}
    .iv-results-btns{flex-direction:column;}
    .iv-member-banner{padding:10px 16px;}
  }
`;

// ─── HELPERS ───────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#AAFF00","#7B2FBE","#C9A227","#ffffff","#88FF44","#9D4EDD"];
  return Array.from({length:70},(_,i)=>({
    id:i,color:colors[i%colors.length],
    left:Math.random()*100,delay:Math.random()*2.5,dur:2+Math.random()*2
  })).map(p=>(
    <div key={p.id} className="confetti-piece" style={{
      left:`${p.left}%`,background:p.color,
      animationDelay:`${p.delay}s`,animationDuration:`${p.dur}s`,
      borderRadius:Math.random()>0.5?"50%":"2px"
    }}/>
  ));
}

function ContentBlock({b}){
  switch(b.type){
    case "quote": return (
      <div className="c-quote">
        <blockquote>"{b.text}"</blockquote>
        <cite>— {b.author}</cite>
      </div>
    );
    case "heading": return <div className="c-heading">{b.text}</div>;
    case "body": return <div className="c-body">{b.text}</div>;
    case "callout": return <div className="c-callout">{b.text}</div>;
    case "list": return (
      <div className="c-list">
        {b.items.map((item,i)=><div key={i} className="c-list-item">{item}</div>)}
      </div>
    );
    case "action": return (
      <div className="c-action">
        <span className="c-action-label">ACTION</span>
        <span className="c-action-text">{b.text}</span>
      </div>
    );
    case "vault": return (
      <div className="c-vault">
        <div className="c-vault-label">
          <span>🔐</span>
          <span>VAULT SECRET</span>
          <span style={{flex:1,height:'1px',background:'linear-gradient(90deg,rgba(201,162,39,0.3),transparent)',marginLeft:8}}/>
        </div>
        <div className="c-vault-title">{b.title}</div>
        <div style={{height:8}}/>
        <div className="c-vault-text">{b.text}</div>
      </div>
    );
    default: return null;
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
export default function IronVaultAcademyUnlocked({ allowedModules = [1, 2, 3, 4, 5, 6], accessType = "all_modules", onModuleComplete }){
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const displayName = user?.email?.address || user?.phone?.number || "Member";

  const [view, setView] = useState("hub");
  const [modIdx, setModIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [confetti, setConfetti] = useState(false);

  const [progress, setProgress] = useState(createEmptyProgress());
  const [progressHydrated, setProgressHydrated] = useState(false);

  const [answers, setAnswers] = useState({});
  const [curQ, setCurQ] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showReadyHelp, setShowReadyHelp] = useState(false);

  useEffect(() => {
    if (ready) {
      setShowReadyHelp(false);
      return;
    }

    const timeout = setTimeout(() => setShowReadyHelp(true), 5000);
    return () => clearTimeout(timeout);
  }, [ready]);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;
    setProgressHydrated(false);

    getAccessToken()
      .then((token) => {
        if (!token) throw new Error("Missing access token")

        return fetch("/api/education-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "get" }),
        })
      })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setProgress(hydrateProgress(data));
      })
      .catch(() => {
        if (cancelled) return;
        setProgress(createEmptyProgress());
      })
      .finally(() => {
        if (cancelled) return;
        setProgressHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, getAccessToken]);

  useEffect(() => {
    if (view !== "lesson") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, lessonIdx]);

  // ── Computed ──
  const totalXP = progress.reduce((s,p,i)=>s+(p.passed?MODULES[i].xpReward:0),0);
  const modsDone = progress.filter(p=>p.passed).length;
  const lessonsDone = progress.reduce((s,p)=>s+p.done.size,0);
  const totalLessons = MODULES.reduce((s,m)=>s+m.lessons.length,0);
  const isSingleModuleAccess = accessType === "single_module";
  const allowedModuleSet = useMemo(() => {
    const ids = new Set([0, ...allowedModules]);
    if (!isSingleModuleAccess) FULL_CURRICULUM_MODULE_IDS.forEach((id) => ids.add(id));
    return ids;
  }, [allowedModules, isSingleModuleAccess]);

  /**
   * UNLOCKED VARIANT: Module access rules
   * - Module 0 is free and always available
   * - Module 1 is available to entitled users without requiring Module 0
   * - Subsequent modules require the previous module quiz to be passed
   * - NO payment check. All modules present, gated only by sequential quiz completion.
   */
  function modStatus(i){
    const mod = MODULES[i];
    if(mod.free){
      if(progress[i].passed) return "passed";
      if(progress[i].done.size > 0) return "progress";
      return "available";
    }
    if(!allowedModuleSet.has(mod.id)) return "locked";
    if(isSingleModuleAccess){
      if(progress[i].passed) return "passed";
      if(progress[i].done.size > 0) return "progress";
      return "available";
    }
    if(mod.id === 1){
      if(progress[i].passed) return "passed";
      if(progress[i].done.size > 0) return "progress";
      return "available";
    }
    // Requires previous module passed
    if(!progress[i-1].passed) return "locked";
    if(progress[i].passed) return "passed";
    if(progress[i].done.size > 0) return "progress";
    return "available";
  }

  function lessonStatus(mi,li){
    if(progress[mi].done.has(li)) return "done";
    const prev = li===0 ? true : progress[mi].done.has(li-1);
    return prev ? "available" : "locked";
  }

  function allLessonsDone(mi){ return progress[mi].done.size >= MODULES[mi].lessons.length; }

  function markDone(mi,li){
    setProgress(prev=>{
      const next=prev.map(p=>({...p,done:new Set(p.done)}));
      next[mi].done.add(li);
      return next;
    });

    if (authenticated) {
      getAccessToken()
        .then((token) => {
          if (!token) return;

          fetch("/api/education-progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
              body: JSON.stringify({ action: "lesson", moduleIndex: MODULES[mi].id, lessonIndex: li }),
          }).catch(() => {});
        })
        .catch(() => {});
    }
  }

  function startQuiz(){
    setQuizQuestions(createShuffledQuiz(MODULES[modIdx].quiz));
    setAnswers({});setCurQ(0);setRevealed(false);setView("quiz");
  }

  function selectOpt(oi){ if(!revealed) setAnswers(a=>({...a,[curQ]:oi})); }

  function confirmAns(){ setRevealed(true); }

  function nextQ(){
    const quiz=quizQuestions;
    if(curQ<quiz.length-1){ setCurQ(q=>q+1); setRevealed(false); }
    else {
      const score=quiz.reduce((s,q,i)=>s+(answers[i]===q.correct?1:0),0);
      const passed=score>=PASS_SCORE;
      setProgress(prev=>{
        const next=prev.map(p=>({...p,done:new Set(p.done)}));
        next[modIdx].score=score; next[modIdx].passed=passed;
        return next;
      });

      if (authenticated) {
        getAccessToken()
          .then((token) => {
            if (!token) return;
            return fetch("/api/education-progress", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ action: "quiz", moduleIndex: MODULES[modIdx].id, score, passed }),
            });
          })
          .then(() => {
            if (passed && onModuleComplete) onModuleComplete();
          })
          .catch(() => {});
      }

      if(passed){setConfetti(true);setTimeout(()=>setConfetti(false),4000);}
      setView("results");
    }
  }

  const letters=["A","B","C","D"];

  // ── Auth gate ──
  if(!ready){
    return(
      <div className="iv">
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"40px 20px",position:"relative",zIndex:1}}>
          <div style={{maxWidth:560,width:"100%",background:"#0F0F0F",border:"1px solid rgba(123,47,190,0.3)",borderRadius:6,padding:"40px 32px",textAlign:"center"}}>
            <div className="iv-dot" style={{margin:"0 auto 16px"}}/>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,letterSpacing:2,color:"#fff",marginBottom:10}}>
              INITIALIZING MEMBER ACCESS
            </div>
            <p style={{fontSize:14,color:"#777",lineHeight:1.7}}>
              Connecting to secure sign-in provider...
            </p>
            {showReadyHelp && (
              <div style={{marginTop:18,padding:"14px 16px",background:"#111",border:"1px solid #1A1A1A",borderRadius:4,textAlign:"left",fontSize:12,color:"#999",lineHeight:1.6}}>
                <div style={{color:"#AAFF00",fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,marginBottom:6}}>TROUBLESHOOT</div>
                <div>Privy initialization is taking longer than expected.</div>
                <div>1. Confirm this exact domain is allowed in your Privy app settings.</div>
                <div>2. Disable ad/privacy blockers for this site.</div>
                <div>3. Hard refresh and retry.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if(!authenticated){
    return(
      <div className="iv">
        <style>{CSS}</style>
        <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"40px 20px",position:"relative",zIndex:1}}>
          <div style={{maxWidth:520,width:"100%",background:"#0F0F0F",border:"1px solid rgba(123,47,190,0.3)",borderRadius:6,padding:"48px 40px",textAlign:"center"}}>
            <div className="iv-dot" style={{margin:"0 auto 20px"}}/>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,letterSpacing:2,color:"#fff",marginBottom:10}}>
              MEMBER<br/><span style={{color:"#AAFF00"}}>ACCESS VAULT</span>
            </div>
            <p style={{fontSize:14,color:"#555",lineHeight:1.7,marginBottom:28}}>
              Member access vault. Sign in to access your curriculum.
            </p>
            <button
              style={{width:"100%",background:"#AAFF00",border:"none",borderRadius:3,padding:16,color:"#080808",fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:2,cursor:"pointer"}}
              onClick={login}
            >
              SIGN IN → ACCESS VAULT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── HUB ──
  if(view==="hub"){
    return(
      <div className="iv">
        <style>{CSS}</style>
        {/* Member banner */}
        <div className="iv-member-banner">
          <span>🔐 MEMBER</span>
          <span style={{color:"#555",fontSize:8,letterSpacing:1}}>·</span>
          <span>{isSingleModuleAccess ? `MODULE ${allowedModules[0] ?? 1} ACCESS` : "FULL CURRICULUM UNLOCKED"}</span>
          <span style={{color:"#555",fontSize:8,letterSpacing:1}}>·</span>
          <span>{isSingleModuleAccess ? `COMPLETE MODULE ${allowedModules[0] ?? 1} TO EARN XP` : "COMPLETE IN SEQUENCE TO EARN XP"}</span>
        </div>
        <header className="iv-header">
          <div className="iv-logo"><div className="iv-dot"/>IRON VAULT</div>
          <div className="iv-xp-wrap">
            <span className="iv-xp-label">XP</span>
            <div className="iv-xp-track"><div className="iv-xp-fill" style={{width:`${(totalXP/TOTAL_XP)*100}%`}}/></div>
            <span className="iv-xp-val">{totalXP.toLocaleString()}</span>
          </div>
          <div className="iv-chip" onClick={async()=>{ await logout(); setProgress(createEmptyProgress()); setProgressHydrated(false); }}>
            👤 {displayName} · Sign Out
          </div>
        </header>
        <div className="iv-hub">
          <div className="iv-wrap">
            <div className="iv-eyebrow">▸ MEMBER — {isSingleModuleAccess ? "SINGLE MODULE ACCESS" : "FULL CURRICULUM ACCESS"}</div>
            <h1 className="iv-h1">Your Vault<br/>Dashboard</h1>
            <p className="iv-sub">{isSingleModuleAccess ? `Module ${allowedModules[0] ?? 1} is unlocked as part of your member position. Module 0 is free. Complete your unlocked module and pass the quiz at 8/10 to earn XP.` : "The full Iron Vault Academy curriculum is unlocked as part of your member position. Start with the free orientation, then complete each module in sequence to earn XP and unlock the next level."}</p>
            <div className="iv-stats">
              <div className="iv-stat"><div className="iv-stat-l">VAULT XP</div><div className="iv-stat-v">{totalXP.toLocaleString()}</div><div className="iv-stat-u">of {TOTAL_XP.toLocaleString()} total</div></div>
              <div className="iv-stat"><div className="iv-stat-l">MODULES PASSED</div><div className="iv-stat-v">{modsDone}</div><div className="iv-stat-u">of {MODULES.length}</div></div>
              <div className="iv-stat"><div className="iv-stat-l">LESSONS DONE</div><div className="iv-stat-v">{lessonsDone}</div><div className="iv-stat-u">of {totalLessons}</div></div>
              <div className="iv-stat"><div className="iv-stat-l">PASS THRESHOLD</div><div className="iv-stat-v">80<span style={{fontSize:16}}>%</span></div><div className="iv-stat-u">8 of 10 correct</div></div>
            </div>
            <div className="iv-eyebrow" style={{marginBottom:14}}>▸ CURRICULUM — {isSingleModuleAccess ? `MODULE ${allowedModules[0] ?? 1} UNLOCKED + FREE ORIENTATION` : "FULL CURRICULUM UNLOCKED"}</div>
            <div className="iv-grid">
              {MODULES.map((mod,i)=>{
                const st=modStatus(i);
                const pct=(progress[i].done.size/mod.lessons.length)*100;
                return(
                  <div key={mod.id} className={`iv-card ${mod.free?"free":""} ${st==="locked"?"locked":""} ${st==="passed"?"passed":""}`}
                    style={{animationDelay:`${i*0.07}s`}}
                    onClick={()=>{ if(st!=="locked"){setModIdx(i);setView("module");} }}>
                    <div className="iv-card-hd">
                      <div className="iv-icon">{mod.icon}</div>
                      <div className={`iv-badge ${st==="locked"?"b-lock":st==="passed"?"b-pass":st==="progress"?"b-prog":"b-avail"}`}>
                        {mod.free&&st!=="passed"?"FREE - START HERE":st==="locked"?"🔒 COMPLETE PREVIOUS":st==="passed"?"✓ PASSED":st==="progress"?"● IN PROGRESS":"▶ AVAILABLE"}
                      </div>
                    </div>
                    <div className="iv-prog-bar">
                      <div className={`iv-prog-fill ${st==="passed"?"green":""}`} style={{width:st==="passed"?"100%":`${pct}%`}}/>
                    </div>
                    <div className="iv-card-tag">MODULE {String(mod.id).padStart(2,"0")} ▸ {mod.tag}</div>
                    <div className="iv-card-title">{mod.title}</div>
                    <div className="iv-card-sub">{mod.subtitle}</div>
                    <div className="iv-card-ft">
                      <div className="iv-meta">⏱ <span>{mod.duration}</span></div>
                      <div className="iv-meta">📖 <span>{mod.lessons.length} lessons</span></div>
                      <div className="iv-meta">⚡ <span style={{color:"#AAFF00"}}>{mod.xpReward}xp</span></div>
                      {progress[i].score!==null&&<div className="iv-meta" style={{color:progress[i].passed?"#AAFF00":"#EF4444"}}>Quiz:{progress[i].score}/10</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MODULE PAGE ──
  if(view==="module"){
    const mod=MODULES[modIdx];
    const allDone=allLessonsDone(modIdx);
    return(
      <div className="iv">
        <style>{CSS}</style>
        <div className="iv-member-banner">
          <span>🔐 MEMBER</span>
          <span style={{color:"#555",fontSize:8}}>·</span>
          <span>{isSingleModuleAccess ? `MODULE ${allowedModules[0] ?? 1} ACCESS` : "FULL CURRICULUM UNLOCKED"}</span>
        </div>
        <header className="iv-header">
          <div className="iv-logo"><div className="iv-dot"/>IRON VAULT</div>
          <div className="iv-xp-wrap">
            <span className="iv-xp-label">XP</span>
            <div className="iv-xp-track"><div className="iv-xp-fill" style={{width:`${(totalXP/TOTAL_XP)*100}%`}}/></div>
            <span className="iv-xp-val">{totalXP.toLocaleString()}</span>
          </div>
          <div className="iv-chip">👤 {displayName}</div>
        </header>
        <div className="iv-page">
          <button className="iv-back" onClick={()=>setView("hub")}>← DASHBOARD</button>
          <div className="iv-eyebrow">MODULE {String(mod.id).padStart(2,"0")} ▸ {mod.tag}</div>
          <h1 className="iv-h1" style={{marginBottom:6}}>{mod.title}</h1>
          <p className="iv-sub" style={{marginBottom:36}}>{mod.subtitle}</p>
          <div className="iv-eyebrow" style={{marginBottom:12}}>▸ LESSONS</div>
          <div className="iv-lessons">
            {mod.lessons.map((lesson,li)=>{
              const ls=lessonStatus(modIdx,li);
              return(
                <div key={li} className={`iv-lesson-row ${ls==="locked"?"l-locked":""}`}
                  onClick={()=>{ if(ls!=="locked"){setLessonIdx(li);setView("lesson");} }}>
                  <span className="iv-ln">{String(li+1).padStart(2,"0")}</span>
                  <span className="iv-lt">{lesson.title}</span>
                  <div className={`iv-lc ${ls==="done"?"lc-done":ls==="available"?"lc-avail":"lc-pend"}`}>
                    {ls==="done"?"✓":ls==="available"?"▶":"🔒"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`iv-quiz-box ${!allDone?"locked":""}`}>
            <div>
              <h3>MODULE QUIZ</h3>
              <p>10 questions · 8/10 to pass · Unlimited retakes</p>
              {progress[modIdx].passed && <p className="pass">✓ Passed — {progress[modIdx].score}/10</p>}
              {!allDone && <p style={{color:"#333",marginTop:4}}>Complete all lessons to unlock</p>}
            </div>
            <button className="iv-qbtn" disabled={!allDone} onClick={()=>{ if(allDone) startQuiz(); }}>
              {progress[modIdx].passed?"RETAKE QUIZ":"START QUIZ →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LESSON ──
  if(view==="lesson"){
    const mod=MODULES[modIdx];
    const lesson=mod.lessons[lessonIdx];
    const isLast=lessonIdx===mod.lessons.length-1;
    function complete(){
      markDone(modIdx,lessonIdx);
      if(isLast) setView("module");
      else setLessonIdx(l=>l+1);
    }
    return(
      <div className="iv">
        <style>{CSS}</style>
        <header className="iv-header">
          <div className="iv-logo"><div className="iv-dot"/>IRON VAULT</div>
          <div className="iv-xp-wrap">
            <span className="iv-xp-label">XP</span>
            <div className="iv-xp-track"><div className="iv-xp-fill" style={{width:`${(totalXP/TOTAL_XP)*100}%`}}/></div>
            <span className="iv-xp-val">{totalXP.toLocaleString()}</span>
          </div>
          <div className="iv-chip">👤 {displayName}</div>
        </header>
        <div className="iv-lesson-view">
          <div className="iv-lesson-nav">
            <button className="iv-back" style={{margin:0}} onClick={()=>setView("module")}>← MODULE</button>
            <span className="iv-lesson-ctr">LESSON {lessonIdx+1} / {mod.lessons.length}</span>
          </div>
          <div className="iv-lesson-hd">
            <div className="iv-lesson-tag">MODULE {mod.id} ▸ {mod.tag}</div>
            <h1 className="iv-lesson-title">{lesson.title}</h1>
          </div>
          <div className="iv-body-stack">
            {lesson.content.map((b,i)=><ContentBlock key={i} b={b}/>)}
          </div>
          <div className="iv-lesson-footer">
            <button className="iv-btn-lime" onClick={complete}>
              {isLast?"COMPLETE MODULE ✓":"NEXT LESSON →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  if(view==="quiz"){
    const quiz=quizQuestions;
    if(!quiz.length) return null;
    const q=quiz[curQ];
    const sel=answers[curQ];
    const correctSoFar=Object.entries(answers).filter(([i,a])=>quiz[parseInt(i)].correct===a).length;
    return(
      <div className="iv">
        <style>{CSS}</style>
        <header className="iv-header">
          <div className="iv-logo"><div className="iv-dot"/>IRON VAULT</div>
          <div className="iv-xp-wrap">
            <span className="iv-xp-label">XP</span>
            <div className="iv-xp-track"><div className="iv-xp-fill" style={{width:`${(totalXP/TOTAL_XP)*100}%`}}/></div>
            <span className="iv-xp-val">{totalXP.toLocaleString()}</span>
          </div>
          <div className="iv-chip">👤 {displayName}</div>
        </header>
        <div className="iv-quiz-view">
          <button className="iv-back" onClick={()=>setView("module")}>← MODULE</button>
          <div className="iv-q-prog-row">
            <span className="iv-q-prog-label">QUESTION {curQ+1} / {quiz.length}</span>
            <span className="iv-q-prog-label">{MODULES[modIdx].title}</span>
          </div>
          <div className="iv-q-prog-track">
            <div className="iv-q-prog-fill" style={{width:`${((curQ+(revealed?1:0))/quiz.length)*100}%`}}/>
          </div>
          <div className="iv-q-card" key={curQ}>
            <div className="iv-q-num">▸ QUESTION {String(curQ+1).padStart(2,"0")}</div>
            <div className="iv-q-text">{q.q}</div>
            <div className="iv-opts">
              {q.options.map((opt,oi)=>{
                let cls="iv-opt";
                if(revealed){ cls+=" dis"; if(oi===q.correct) cls+=" correct"; else if(oi===sel&&oi!==q.correct) cls+=" wrong"; }
                else if(sel===oi) cls+=" sel";
                return(
                  <button key={oi} className={cls} onClick={()=>selectOpt(oi)}>
                    <span className="iv-opt-l">{letters[oi]}</span>{opt}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="iv-q-footer">
            <span className="iv-q-score">{revealed?`${correctSoFar} correct so far`:`Need ${PASS_SCORE}/10 to pass`}</span>
            {!revealed
              ? <button className="iv-qbtn" style={{opacity:sel===undefined?0.4:1}} disabled={sel===undefined} onClick={confirmAns}>CONFIRM</button>
              : <button className="iv-qbtn" onClick={nextQ}>{curQ<quiz.length-1?"NEXT →":"SEE RESULTS →"}</button>
            }
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if(view==="results"){
    const score=progress[modIdx].score;
    const passed=progress[modIdx].passed;
    const mod=MODULES[modIdx];
    // hasNext requires both a next module in the array AND that module being in the user's allowedModuleSet
    const hasNext=modIdx+1<MODULES.length && allowedModuleSet.has(MODULES[modIdx+1].id);
    const isOrientation=mod.id === 0;
    return(
      <div className="iv">
        <style>{CSS}</style>
        {confetti&&passed&&<Confetti/>}
        <header className="iv-header">
          <div className="iv-logo"><div className="iv-dot"/>IRON VAULT</div>
          <div className="iv-xp-wrap">
            <span className="iv-xp-label">XP</span>
            <div className="iv-xp-track"><div className="iv-xp-fill" style={{width:`${(totalXP/TOTAL_XP)*100}%`}}/></div>
            <span className="iv-xp-val">{totalXP.toLocaleString()}</span>
          </div>
          <div className="iv-chip">👤 {displayName}</div>
        </header>
        <div className="iv-results">
          <span className="iv-results-icon">{passed?"🏆":"📖"}</span>
          <div className={`iv-results-score ${passed?"rs-pass":"rs-fail"}`}>{score}/10</div>
          <div className="iv-results-title">{passed ? (isOrientation ? "ORIENTATION COMPLETE" : "VAULT UNLOCKED") : "NOT YET"}</div>
          <p className="iv-results-sub">
            {passed
              ? isOrientation
                ? "You passed the Iron Vault Orientation. Your submission has been recorded. A representative may follow up with next steps. You can continue learning inside the Iron Vault Academy."
                : `Module ${mod.id} complete. You now know what most people will never be taught.`
              : `${score}/10 — we need ${PASS_SCORE} to pass. Review the lessons. The knowledge will stick harder the second time.`}
          </p>
          {passed&&<div className="iv-results-xp">⚡ +{mod.xpReward} XP EARNED</div>}
          <div className="iv-results-btns">
            <button className="iv-btn-ghost" onClick={startQuiz}>{passed?"RETAKE":"TRY AGAIN →"}</button>
            {passed&&!hasNext&&<button className="iv-btn-ghost" onClick={()=>setView("hub")}>VIEW DASHBOARD →</button>}
            <button className="iv-btn-lime" onClick={()=>{
              // Guard: only advance to next module if it is explicitly in allowedModuleSet
              if(passed&&hasNext&&allowedModuleSet.has(MODULES[modIdx+1].id)){setModIdx(m=>m+1);setView("module");}
              else setView("hub");
            }}>
              {passed&&hasNext?`NEXT: ${MODULES[modIdx+1].tag} →`:"BACK TO DASHBOARD"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
