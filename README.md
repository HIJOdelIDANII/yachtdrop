# YachtDrop

Marine parts delivery service — order boat supplies as easily as ordering food.

## 🚀 Overview

YachtDrop is a mobile-first e-commerce platform for marine supplies, inspired by Uber Eats' UX patterns. Browse, search, and order boat parts with delivery to your berth.

## ✨ Features

- **Discovery-first home page** — curated trending products and best offers
- **Category browsing** with infinite scroll and filters
- **Real-time search** with instant results
- **Mobile-optimized UI** following Uber Eats design patterns
- **Cart management** with delivery/pickup options
- **Order tracking** with real-time status updates
- **Marina location services** with overpass API integration

## 🏗️ Architecture

### Frontend (Next.js 13+)
- **Framework**: Next.js 13 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (cart, filters, UI)
- **Animations**: Framer Motion (optimized for performance)
- **Data fetching**: React Query with caching
- **TypeScript**: Strict mode throughout

### Backend
- **API**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel (frontend) + Railway/Heroku (database)

### Data Pipeline
- **Scraper**: Python (BeautifulSoup + aiohttp) for Nautichandler
- **Cleaning**: Automated price normalization and deduplication
- **Sync**: Scheduled runs to keep product data fresh

## 📱 UI/UX Design

### Mobile-First Patterns
- **Home**: Discovery surface (hero → search → category icons → curated rows)
- **Browse**: Infinite grid with category filters
- **Search**: List view with quick-add buttons
- **Product**: Bottom sheet with image gallery
- **Cart**: Floating pill bar + drawer with checkout flow

### Key Decisions
- Horizontal scroll rows for curated content (signals "there's more")
- Floating + buttons for 1-tap cart adds
- CSS transforms for tap feedback (GPU-composited, zero JS cost)
- Memoized components to prevent unnecessary re-renders
- Lazy loading images below the fold

## 🛠️ Development

### Prerequisites
```bash
Node.js 22+
PostgreSQL 14+
```

### Setup
```bash
# Clone the repository
git clone https://github.com/HIJOdelIDANII/yachtdrop.git
cd yachtdrop

# Frontend setup
cd web
npm install
cp .env.example .env.local
# Fill .env.local with your values

# Database setup
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Next.js
NEXT_PUBLIC_DELIVERY_FEE=5.00

# Vercel (for deployment)
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
VERCEL_TOKEN=...
```

### Project Structure
```
yachtdrop/
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and hooks
│   │   ├── store/         # Zustand state
│   │   └── types/         # TypeScript definitions
│   ├── prisma/            # Database schema
│   └── public/            # Static assets
├── scraper/               # Python data pipeline
└── .github/workflows/     # CI/CD
```

## 🧪 Data Pipeline

The scraper runs automatically to keep product data synchronized with Nautichandler:

```bash
# Run scraper (from scraper/ directory)
python main.py

# Clean and normalize data
python clean.py --dry-run  # Preview changes
python clean.py           # Apply changes
```

### Scraping Strategy
- **Categories**: Extract from sitemap and navigation
- **Products**: Parallel scraping with rate limiting
- **Images**: Download and optimize for URLs
- **Pricing**: Normalize EUR prices, detect discounts
- **Stock**: Track availability status

## 🚀 Deployment

### Production
```bash
# Merge to main branch triggers:
# 1. Production deployment to Vercel
# 2. Database migrations
# 3. scraper data sync
```

### CI/CD Pipeline
- **Push to main**: Deploy production + run migrations
- **Push to other branches**: No CI (fast for solo development)
- **Pull requests**: Not used (solo workflow)

## 📊 Performance Optimizations

### Frontend
- **Images**: Next.js optimization with lazy loading
- **Components**: React.memo for expensive renders
- **Animations**: CSS transforms over JS where possible
- **Bundle**: Code splitting and dynamic imports
- **Cache**: React Query with 5min stale time

### Database
- **Indexes**: Optimized for search queries
- **Connections**: Pooling for production
- **Migrations**: Zero-downtime deployment strategy

## 🐛 Known Issues & TODOs

- [ ] Add product comparison feature
- [ ] Implement saved searches/alerts
- [ ] Add customer reviews and ratings
- [ ] Expand to more marine suppliers
- [ ] Add international shipping options

## 📄 License

MIT License — see LICENSE file for details.

## 🤝 Contributing

Currently a solo project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure TypeScript builds and tests pass
5. Submit a pull request

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Email: support@yachtdrop.com

---

Built with ❤️ for the marine community
