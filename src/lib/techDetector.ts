// ============================================================
// ScrapeIntel — Tech Stack Detector
// ============================================================

import * as cheerio from "cheerio";

interface TechPattern {
  name: string;
  category: string;
  patterns: RegExp[];
}

/**
 * Known technology signatures to detect from HTML source.
 */
const TECH_PATTERNS: TechPattern[] = [
  // JavaScript Frameworks
  { name: "React", category: "Frontend", patterns: [/react(?:\.min)?\.js/i, /\breact-dom\b/i, /__NEXT_DATA__/i, /data-reactroot/i] },
  { name: "Next.js", category: "Frontend", patterns: [/__NEXT_DATA__/i, /_next\/static/i, /next\.js/i] },
  { name: "Vue.js", category: "Frontend", patterns: [/vue(?:\.min)?\.js/i, /data-v-[a-f0-9]/i, /vuejs/i] },
  { name: "Nuxt.js", category: "Frontend", patterns: [/__NUXT__/i, /_nuxt\//i] },
  { name: "Angular", category: "Frontend", patterns: [/angular(?:\.min)?\.js/i, /ng-version/i, /\bng-app\b/i] },
  { name: "Svelte", category: "Frontend", patterns: [/svelte/i, /__svelte/i] },
  { name: "jQuery", category: "Frontend", patterns: [/jquery(?:\.min)?\.js/i, /jquery\//i] },
  { name: "Gatsby", category: "Frontend", patterns: [/gatsby/i, /gatsby-image/i] },
  { name: "Remix", category: "Frontend", patterns: [/remix/i, /__remixContext/i] },

  // CSS Frameworks
  { name: "Tailwind CSS", category: "CSS", patterns: [/tailwind/i, /tailwindcss/i] },
  { name: "Bootstrap", category: "CSS", patterns: [/bootstrap(?:\.min)?\.(?:css|js)/i] },
  { name: "Material UI", category: "CSS", patterns: [/mui/i, /material-ui/i] },
  { name: "Bulma", category: "CSS", patterns: [/bulma(?:\.min)?\.css/i] },

  // CMS & Platforms
  { name: "WordPress", category: "CMS", patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
  { name: "Shopify", category: "E-commerce", patterns: [/shopify/i, /cdn\.shopify\.com/i, /myshopify/i] },
  { name: "Wix", category: "CMS", patterns: [/wix\.com/i, /wixstatic/i, /parastorage/i] },
  { name: "Squarespace", category: "CMS", patterns: [/squarespace/i, /sqsp/i] },
  { name: "Webflow", category: "CMS", patterns: [/webflow/i, /wf-/i] },
  { name: "Drupal", category: "CMS", patterns: [/drupal/i, /sites\/default\/files/i] },
  { name: "Ghost", category: "CMS", patterns: [/ghost/i, /ghost-(?:url|api)/i] },
  { name: "HubSpot", category: "Marketing", patterns: [/hubspot/i, /hs-scripts/i, /hbspt/i] },

  // Analytics & Tracking
  { name: "Google Analytics", category: "Analytics", patterns: [/google-analytics\.com/i, /googletagmanager/i, /gtag/i, /UA-\d+/i, /G-[A-Z0-9]+/i] },
  { name: "Google Tag Manager", category: "Analytics", patterns: [/googletagmanager\.com\/gtm/i, /GTM-[A-Z0-9]+/i] },
  { name: "Hotjar", category: "Analytics", patterns: [/hotjar/i, /hj\(/i] },
  { name: "Mixpanel", category: "Analytics", patterns: [/mixpanel/i] },
  { name: "Segment", category: "Analytics", patterns: [/segment\.com\/analytics/i, /cdn\.segment/i] },
  { name: "Amplitude", category: "Analytics", patterns: [/amplitude/i, /cdn\.amplitude/i] },

  // Cloud & Infrastructure
  { name: "AWS", category: "Cloud", patterns: [/amazonaws\.com/i, /aws-sdk/i, /cloudfront\.net/i] },
  { name: "Google Cloud", category: "Cloud", patterns: [/googleapis\.com/i, /gstatic\.com/i] },
  { name: "Cloudflare", category: "CDN", patterns: [/cloudflare/i, /cdnjs\.cloudflare/i, /cf-ray/i] },
  { name: "Vercel", category: "Hosting", patterns: [/vercel/i, /vercel\.app/i, /_vercel/i] },
  { name: "Netlify", category: "Hosting", patterns: [/netlify/i, /netlify\.app/i] },
  { name: "Heroku", category: "Hosting", patterns: [/heroku/i, /herokuapp/i] },

  // Other Tools
  { name: "Stripe", category: "Payments", patterns: [/stripe\.com/i, /stripe\.js/i, /js\.stripe/i] },
  { name: "Intercom", category: "Support", patterns: [/intercom/i, /intercomcdn/i] },
  { name: "Zendesk", category: "Support", patterns: [/zendesk/i, /zdassets/i] },
  { name: "Crisp", category: "Support", patterns: [/crisp\.chat/i, /client\.crisp/i] },
  { name: "Sentry", category: "Monitoring", patterns: [/sentry/i, /sentry\.io/i] },
  { name: "Datadog", category: "Monitoring", patterns: [/datadoghq/i, /datadog/i] },
  { name: "Freshdesk", category: "Support", patterns: [/freshdesk/i, /freshworks/i] },
  { name: "Mailchimp", category: "Marketing", patterns: [/mailchimp/i, /chimpstatic/i] },
  { name: "Recaptcha", category: "Security", patterns: [/recaptcha/i, /grecaptcha/i] },
  { name: "Font Awesome", category: "Icons", patterns: [/fontawesome/i, /font-awesome/i] },
  { name: "TypeScript", category: "Language", patterns: [/typescript/i, /\.ts\b/i] },
  { name: "GraphQL", category: "API", patterns: [/graphql/i, /\/graphql/i] },
];

/**
 * Detect technologies used on a webpage by analyzing its HTML source.
 */
export function detectTechStack(html: string, $: cheerio.CheerioAPI): string[] {
  const detectedTechs = new Set<string>();

  // Check the full HTML source against all patterns
  for (const tech of TECH_PATTERNS) {
    for (const pattern of tech.patterns) {
      if (pattern.test(html)) {
        detectedTechs.add(`${tech.name}`);
        break; // One match is enough per tech
      }
    }
  }

  // Check <meta name="generator"> tag
  const generator = $('meta[name="generator"]').attr("content");
  if (generator) {
    detectedTechs.add(generator.split(/\s/)[0]); // First word, e.g., "WordPress"
  }

  // Check X-Powered-By style hints in meta tags
  const poweredBy = $('meta[name="powered-by"], meta[http-equiv="X-Powered-By"]').attr("content");
  if (poweredBy) {
    detectedTechs.add(poweredBy);
  }

  // Check for specific framework data attributes
  if ($("[data-reactroot], [data-reactid]").length > 0) detectedTechs.add("React");
  if ($("[ng-app], [ng-controller], [ng-model]").length > 0) detectedTechs.add("Angular");
  if ($("[data-v-]").length > 0 || $("[v-bind], [v-model], [v-if]").length > 0) detectedTechs.add("Vue.js");

  return Array.from(detectedTechs).sort();
}
