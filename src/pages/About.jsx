import React from "react";
import { Shield, Target, Lock, Users } from "lucide-react";

export default function About() {
  const team = [
    { name: "Shreya", role: "Lead Developer", dept: "Cyber Crime Division" },
    { name: "Shreya", role: "Intelligence Analyst", dept: "Digital Forensics" },
    { name: "Shreya", role: "Security Architect", dept: "Network Security" },
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary pt-16">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/30 rounded-3xl mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-6xl tracking-wider text-text-primary mb-4">
            ABOUT <span className="text-primary">US</span>
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Traxalon is a specialized intelligence platform built for law enforcement agencies
            to conduct covert digital surveillance operations with precision and legality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: <Target className="w-6 h-6" />, title: "Our Mission", desc: "Empower law enforcement with cutting-edge tracking technology to reduce investigation time and improve case closure rates across India." },
            { icon: <Lock className="w-6 h-6" />, title: "Our Commitment", desc: "Every tool we build adheres to the IT Act 2000 and CrPC guidelines. Access is strictly limited to verified government officers with valid badge IDs." },
            { icon: <Users className="w-6 h-6" />, title: "Our Users", desc: "We serve over 2,400 verified police officers across 18 states, from cyber crime cells to organized crime units." },
          ].map((item, i) => (
            <div key={i} className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary mb-4">
                {item.icon}
              </div>
              <h3 className="font-display text-xl text-text-primary tracking-wide mb-2">{item.title}</h3>
              <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-surface-elevated border border-accent/20 rounded-2xl p-6 mb-16">
          <h3 className="font-display text-xl text-accent tracking-wide mb-3">⚠️ Legal Notice</h3>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            Traxalon is intended solely for use by authorized law enforcement personnel in the
            performance of official duties. Unauthorized use of this tool to track individuals
            without proper legal authorization constitutes a violation of the IT Act 2000,
            Section 66 (Computer Related Offences) and may result in criminal prosecution.
            All activity on this platform is logged and auditable by senior officials.
          </p>
        </div>

        <div className="text-center mb-10">
          <h2 className="font-display text-4xl tracking-wider text-text-primary">
            THE <span className="text-primary">TEAM</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {team.map((member, i) => (
            <div key={i} className="bg-surface-elevated border border-surface-border rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 border-2 border-primary/30 rounded-full flex items-center justify-center text-primary font-display text-2xl mx-auto mb-4">
                {member.name[0]}
              </div>
              <h3 className="font-display text-lg text-text-primary tracking-wide">{member.name}</h3>
              <p className="font-body text-sm text-primary mt-1">{member.role}</p>
              <p className="font-body text-xs text-text-muted mt-1">{member.dept}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}