import React from 'react';
import Card from '../../components/ui/Card';

export default function HelpFaq() {
  const faqs = [
    {
      q: 'How is my crop claim payout calculated?',
      a: 'The suggested payout amount follows a precise formula: Sown Area (hectares) × Sum Insured per hectare (set by PMFBY guidelines) × Crop damage severity percentage (as calculated by NVIDIA Vision AI and verified by on-site audits).',
    },
    {
      q: 'Who verifies my claim?',
      a: 'KrishiSeva uses a three-tier validation mechanism to eliminate bias: 1) Geotagged computer vision analyses crop stress; 2) Local NGO partner representatives perform field-level visits to cross-verify physical damage; 3) Government officers (SDMs) perform the final audit and trigger payment direct to your bank.',
    },
    {
      q: 'Why was my claim rejected or flagged?',
      a: 'Claims are primarily flagged if: 1) Geolocation tags do not align with your registered survey boundary; 2) AI vision identifies a crop different from the land registry record; 3) The uploaded photograph matches a pre-existing claim (duplicate check).',
    },
    {
      q: 'What do I do if I disagree with the official decision?',
      a: 'You can submit updated documentary proof (like official village taluka records or fresh geotagged photos) to your local NGO representatives or file a direct review petition with the SDM Office.',
    },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Help & FAQ</h1>
        <p className="text-sm text-text-secondary">Find answers to common questions about verification and payouts</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <Card key={idx} className="p-5 bg-surface border border-border-default hover:border-accent/40 transition-colors">
            <h3 className="font-bold text-text-primary text-sm mb-2">Q: {faq.q}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">A: {faq.a}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5 bg-accent-light/35 border border-accent/20">
        <h4 className="font-bold text-xs text-accent uppercase tracking-wider mb-1.5">Need further help?</h4>
        <p className="text-xs text-text-secondary leading-relaxed">
          Contact your village krishi officer or NGO volunteers at the local helpdesk. Support Helpline: <span className="font-semibold text-text-primary">1800-180-1551</span> (Toll-Free).
        </p>
      </Card>
    </div>
  );
}
