import { supabase } from './supabaseClient';
import { User, VerificationRequest, PackageDef, GlobalConfig } from '../types';

// --- Types mapping helpers ---

const mapUserFromDB = (u: any): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  organization: u.organization,
  password: u.password,
  credits: Number(u.credits || 0),
  subscriptionPlan: u.subscription_plan,
  subscriptionExpiry: u.subscription_expiry,
  status: u.status
});

const mapRequestFromDB = (r: any): VerificationRequest => ({
  id: r.id,
  candidateName: r.candidate_name,
  institution: r.institution,
  degree: r.degree,
  graduationYear: r.graduation_year,
  status: r.status,
  submissionDate: r.submission_date,
  lastUpdated: r.last_updated,
  clientId: r.client_id,
  clientName: r.client_name,
  documentUrl: r.document_url,
  verificationOutcome: r.verification_outcome,
  finalReportNote: r.final_report_note,
  manualVerificationRequested: r.manual_verification_requested,
  aiAnalysis: r.ai_analysis,
  timeline: typeof r.timeline === 'string' ? JSON.parse(r.timeline) : r.timeline
});

// --- Fetch Actions ---

export const db = {
  // CONFIG
  async getConfig(): Promise<GlobalConfig | null> {
    const { data, error } = await supabase.from('global_config').select('*').single();
    if (error) return null;
    return {
      appName: data.app_name,
      logoUrl: data.logo_url,
      copyrightText: data.copyright_text,
      showDemoCreds: data.show_demo_creds,
      currency: data.currency as 'USD' | 'GHS'
    };
  },

  async saveConfig(config: GlobalConfig) {
    const payload = {
      id: 'default',
      app_name: config.appName,
      logo_url: config.logoUrl,
      copyright_text: config.copyrightText,
      show_demo_creds: config.showDemoCreds,
      currency: config.currency
    };
    await supabase.from('global_config').upsert(payload);
  },

  // USERS
  async getUsers(): Promise<User[] | null> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return null;
    return data.map(mapUserFromDB);
  },

  async saveUser(user: User) {
    // In a real app, don't store passwords in plain text!
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      password: user.password,
      credits: user.credits,
      subscription_plan: user.subscriptionPlan,
      subscription_expiry: user.subscriptionExpiry,
      status: user.status
    };
    await supabase.from('users').upsert(payload);
  },

  async deleteUser(userId: string) {
    await supabase.from('users').delete().eq('id', userId);
  },

  // PACKAGES
  async getPackages(): Promise<PackageDef[] | null> {
    const { data, error } = await supabase.from('packages').select('*');
    if (error) return null;
    return data.map(p => ({
        ...p,
        credits: p.credits === 'UNLIMITED' ? 'UNLIMITED' : Number(p.credits),
        durationMonths: p.duration_months
    }));
  },

  async savePackage(pkg: PackageDef) {
    const payload = {
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        credits: String(pkg.credits),
        duration_months: pkg.durationMonths,
        description: pkg.description
    };
    await supabase.from('packages').upsert(payload);
  },

  async deletePackage(pkgId: string) {
    await supabase.from('packages').delete().eq('id', pkgId);
  },

  // REQUESTS
  async getRequests(): Promise<VerificationRequest[] | null> {
    const { data, error } = await supabase.from('requests').select('*').order('submission_date', { ascending: false });
    if (error) return null;
    return data.map(mapRequestFromDB);
  },

  async saveRequest(req: VerificationRequest) {
    const payload = {
      id: req.id,
      candidate_name: req.candidateName,
      institution: req.institution,
      degree: req.degree,
      graduation_year: req.graduationYear,
      status: req.status,
      submission_date: req.submissionDate,
      last_updated: req.lastUpdated,
      client_id: req.clientId,
      client_name: req.clientName,
      document_url: req.documentUrl, // Note: Storing Base64 in text column is heavy. 
      verification_outcome: req.verificationOutcome,
      final_report_note: req.finalReportNote,
      manual_verification_requested: req.manualVerificationRequested,
      ai_analysis: req.aiAnalysis,
      timeline: req.timeline
    };
    await supabase.from('requests').upsert(payload);
  },

  // SEEDER
  // Function to populate DB if empty, so the app doesn't look broken
  async seedIfNeeded(
    initialRequests: VerificationRequest[], 
    initialUsers: User[], 
    initialPackages: PackageDef[],
    initialConfig: GlobalConfig
  ) {
    // Check Config
    const { count: configCount } = await supabase.from('global_config').select('*', { count: 'exact', head: true });
    if (configCount === 0) {
       await this.saveConfig(initialConfig);
    }

    // Check Users
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (userCount === 0) {
        for (const u of initialUsers) await this.saveUser(u);
    }

    // Check Packages
    const { count: pkgCount } = await supabase.from('packages').select('*', { count: 'exact', head: true });
    if (pkgCount === 0) {
        for (const p of initialPackages) await this.savePackage(p);
    }

    // Check Requests
    const { count: reqCount } = await supabase.from('requests').select('*', { count: 'exact', head: true });
    if (reqCount === 0) {
        for (const r of initialRequests) await this.saveRequest(r);
    }
  }
};
