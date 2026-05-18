import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Landmark,
  LockKeyhole,
  Radio,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import home1 from '../images/home1.jpg';
import home2 from '../images/home2.jpg';
import home3 from '../images/home3.jpg';
import home4 from '../images/home4.jpg';

const highlights = [
  { value: '12+', label: 'finance workflows connected' },
  { value: '24/7', label: 'secure access and reporting' },
  { value: '3x', label: 'faster monthly close process' }
];

const features = [
  { icon: TrendingUp, title: 'Revenue intelligence', text: 'Track advertising, sponsorships, digital income and event revenue with clean totals and monthly movement.' },
  { icon: FileText, title: 'Invoice control', text: 'Create invoices, record payments, monitor outstanding balances and keep client billing visible.' },
  { icon: Landmark, title: 'Bank reconciliation', text: 'Match bank activity with internal records so every payment and expense has a clear audit trail.' },
  { icon: ShieldCheck, title: 'Approval oversight', text: 'Give station leaders, finance teams and auditors the right views without exposing unnecessary actions.' }
];

const workflow = [
  'Capture revenue, expenses, invoices and bookings as daily station activity happens.',
  'Review dashboards for profit, cash flow, receivables and expense pressure.',
  'Close reports with financial statements, reconciliations and audit-ready summaries.'
];

const roleCards = [
  { icon: Users, title: 'Station Manager', text: 'Executive visibility across people, approvals, login activity and station performance.' },
  { icon: BarChart3, title: 'Finance Manager', text: 'Full financial dashboard with revenue composition, profit momentum and cash flow insight.' },
  { icon: CalendarCheck, title: 'Marketing Team', text: 'Advertiser, booking and airtime workflows connected to billing and revenue records.' },
  { icon: LockKeyhole, title: 'Auditor', text: 'Read-focused access for reports, financial controls and compliance review.' }
];

const gallery = [
  { image: home2, title: 'Revenue growth', text: 'See client income, stream mix and monthly performance in one calm view.' },
  { image: home3, title: 'Cash movement', text: 'Understand inflows, outflows and operating cash flow before decisions are made.' },
  { image: home4, title: 'Expense control', text: 'Keep spending visible by category, status and business impact.' }
];

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const redirectPath = {
        FINANCE_OFFICER: '/dashboard',
        MARKETING_OFFICER: '/adcontracts',
        STAFF: '/payroll'
      }[user.role] || '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-page page">
      <header className="home-nav">
        <Link to="/" className="home-brand">
          <span><Radio size={20} /></span>
          Lekope FM FIS
        </Link>
        <nav className="home-nav__links" aria-label="Homepage sections">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#roles">Roles</a>
          <a href="#contact">Access</a>
        </nav>
        <div className="home-nav__actions">
          <Link className="btn btn-ghost" to="/login">Login</Link>
          <Link className="btn btn-gold" to="/register">Create account</Link>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="landing-hero__eyebrow">Radio finance, organized beautifully</span>
          <h1>Lekope FM financial control for revenue, expenses and reporting.</h1>
          <p>
            A complete finance workspace for radio operations: invoices, advertisers, expenses,
            payroll, tax, assets, reconciliation and executive dashboards working together.
          </p>
          <div className="landing-hero__buttons">
            <Link className="btn btn-gold" to="/login">Open dashboard</Link>
            <a className="btn btn-ghost" href="#features">Explore features</a>
          </div>
          <div className="landing-hero__stats">
            {highlights.map(item => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="home-hero__visual">
          <img src={home1} alt="Lekope FM financial dashboard preview" />
          <div className="home-hero__floating home-hero__floating--top">
            <span>Net profit</span>
            <strong>Live</strong>
          </div>
          <div className="home-hero__floating home-hero__floating--bottom">
            <CheckCircle2 size={18} />
            Reconciled records
          </div>
        </div>
      </section>

      <section className="home-strip" aria-label="System capabilities">
        {['Revenue', 'Expenses', 'Invoices', 'Payroll', 'Tax', 'Assets', 'Reports', 'Analytics'].map(item => (
          <span key={item}>{item}</span>
        ))}
      </section>

      <section id="features" className="home-section">
        <div className="home-section__head">
          <span>Core tools</span>
          <h2>Everything the station needs to keep finance moving.</h2>
          <p>Designed for daily use, monthly review and management decisions that cannot wait for scattered spreadsheets.</p>
        </div>
        <div className="home-feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="home-showcase">
        <div className="home-showcase__media">
          <img src={home2} alt="Revenue dashboard visual" />
        </div>
        <div className="home-showcase__copy">
          <span>Workflow</span>
          <h2>From daily entries to audit-ready reports.</h2>
          <p>
            The system keeps operational activity connected to the finance picture, so managers
            can move from transaction detail to strategic decisions without losing context.
          </p>
          <div className="home-steps">
            {workflow.map((step, index) => (
              <div className="home-step" key={step}>
                <strong>{index + 1}</strong>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <span>Visual reporting</span>
          <h2>Clear pictures for the numbers that matter.</h2>
          <p>Use dashboards to understand movement quickly, then open the detailed module when action is needed.</p>
        </div>
        <div className="home-gallery">
          {gallery.map(item => (
            <article className="home-gallery-card" key={item.title}>
              <img src={item.image} alt={`${item.title} dashboard preview`} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="roles" className="home-section">
        <div className="home-section__head">
          <span>Role access</span>
          <h2>Built for the people who run the station.</h2>
          <p>Each role sees focused tools while leadership keeps the wider operational picture in reach.</p>
        </div>
        <div className="home-role-grid">
          {roleCards.map(({ icon: Icon, title, text }) => (
            <article className="home-role-card" key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="home-cta">
        <div>
          <span>Ready to work</span>
          <h2>Open the system and keep the station finances moving.</h2>
          <p>Login to continue with live data, or create an account for a new authorized user.</p>
        </div>
        <div className="home-cta__actions">
          <Link className="btn btn-gold" to="/login">Login</Link>
          <Link className="btn btn-ghost" to="/register">Create account</Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
