"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBackend } from "../../lib/api/useBackend";
import BackendStatus from "../../components/BackendStatus";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { backendOnline, systemStatus, retryConnection } = useBackend();
  const [country, setCountry] = useState("GHA");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    location: "",
    education: "",
    skillsText: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const countries = [
    { code: "GHA", name: "Ghana",      flag: "🇬🇭", context: "Urban Informal Economy" },
    { code: "BGD", name: "Bangladesh", flag: "🇧🇩", context: "Rural Agricultural Economy" },
    { code: "PAK", name: "Pakistan",   flag: "🇵🇰", context: "Urban Mixed Informal Economy" },
  ];

  const educationLevels = {
    GHA: [
      { id: "none",       label: "No Formal Education" },
      { id: "primary",    label: "Primary School (P1-P6)" },
      { id: "jss",        label: "Junior Secondary (JHS)" },
      { id: "sss",        label: "Senior Secondary (SHS)" },
      { id: "vocational", label: "Vocational / Technical Training" },
      { id: "tertiary",   label: "Tertiary (University/Polytechnic)" },
    ],
    BGD: [
      { id: "none",       label: "No Formal Education" },
      { id: "primary",    label: "Primary (Class I-V)" },
      { id: "secondary",  label: "Secondary (Class VI-X)" },
      { id: "ssc",        label: "SSC Certificate" },
      { id: "hsc",        label: "HSC Certificate" },
      { id: "vocational", label: "Vocational / SSC (Vocational)" },
      { id: "diploma",    label: "Diploma in Engineering" },
      { id: "tertiary",   label: "Bachelor's Degree" },
    ],
    PAK: [
      { id: "none",         label: "No Formal Education" },
      { id: "primary",      label: "Primary (Class 1-5)" },
      { id: "middle",       label: "Middle (Class 6-8)" },
      { id: "matric",       label: "Matric / SSC (Class 9-10)" },
      { id: "intermediate", label: "Intermediate / FA / FSc (Class 11-12)" },
      { id: "vocational",   label: "Vocational / TEVTA Certificate" },
      { id: "diploma",      label: "Diploma of Associate Engineer (DAE)" },
      { id: "tertiary",     label: "Bachelor's Degree" },
    ],
  };

  const demoPersonas = {
    GHA: {
      name: "Amara",
      age: "22",
      location: "Accra",
      education: "sss",
      skillsText: "I repair mobile phones and tablets. I've been doing this since I was 17 — people in my neighborhood bring me broken screens, battery issues, software problems. I speak English, Twi, and some Hausa. I taught myself Python and HTML from YouTube. I also help my aunt sell clothes at Makola Market on weekends. I can negotiate with suppliers and manage inventory.",
    },
    BGD: {
      name: "Nusrat",
      age: "21",
      location: "Rural Rangpur",
      education: "ssc",
      skillsText: "I help my family farm rice and vegetables. I know when to plant and harvest, how to manage water in the dry months. I sew garments — shirts, kameez — at home, the cooperative pays per piece. I use a mobile phone for prayers, weather, and to message my cousin in Dhaka. I want to learn tailoring patterns so I can train other women in our village.",
    },
    PAK: {
      name: "Ayesha",
      age: "23",
      location: "Karachi (Korangi)",
      education: "intermediate",
      skillsText: "I help my family run a stitching business from home — we take orders from a boutique in Tariq Road, three or four sets a week. I cut, stitch, and finish kameez and shalwar. I learned Canva and Excel from YouTube, so I make our orders sheet and the boutique's Instagram posts. I speak Urdu, Sindhi, and English. I want to start taking orders directly so we don't lose half the money to the middleman.",
    },
  };

  const handleLoadDemo = () => {
    const demo = demoPersonas[country];
    setFormData(demo);
  };

  const handleSubmit = (destination = '/assess') => {
    setIsProcessing(true);
    // Store in sessionStorage and navigate to results
    const payload = {
      ...formData,
      countryCode: country,
      backendAvailable: backendOnline || false,
    };
    sessionStorage.setItem('unmapped_profile', JSON.stringify(payload));
    
    setTimeout(() => {
      router.push(destination);
    }, 1500);
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <main className={styles.main}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>◆</span>
            <span className={styles.logoText}>UNMAPPED</span>
          </Link>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <BackendStatus
              backendOnline={backendOnline}
              systemStatus={systemStatus}
              onRetry={retryConnection}
            />
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
              </div>
              <span className={styles.progressLabel}>Step {step} of {totalSteps}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Step 1: Country & Basic Info */}
        {step === 1 && (
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className="section-label">Step 1 of 3</span>
              <h1 className="section-title">Let&apos;s start with you.</h1>
              <p className="section-subtitle">Tell us about yourself. This information helps us calibrate the skills assessment to your local context.</p>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Country / Context</label>
              <div className={styles.countrySelector}>
                {countries.map(c => (
                  <button
                    key={c.code}
                    className={`${styles.countryOption} ${country === c.code ? styles.countryActive : ''}`}
                    onClick={() => setCountry(c.code)}
                  >
                    <span className={styles.countryFlag}>{c.flag}</span>
                    <div>
                      <div className={styles.countryName}>{c.name}</div>
                      <div className={styles.countryContext}>{c.context}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formSection}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formSection}>
                <label className={styles.label}>Age</label>
                <input
                  type="number"
                  placeholder="e.g. 22"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Location</label>
              <input
                type="text"
                placeholder="City or region"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className={styles.input}
              />
            </div>

            <div className={styles.stepActions}>
              <button className="btn btn-secondary" onClick={handleLoadDemo}>
                ✨ Load Demo Profile ({demoPersonas[country].name})
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.age}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Education */}
        {step === 2 && (
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className="section-label">Step 2 of 3</span>
              <h1 className="section-title">Your education level.</h1>
              <p className="section-subtitle">Select the highest level of education you have completed. Don&apos;t worry — many valuable skills come from outside the classroom.</p>
            </div>

            <div className={styles.educationGrid}>
              {educationLevels[country].map(level => (
                <button
                  key={level.id}
                  className={`${styles.educationOption} ${formData.education === level.id ? styles.educationActive : ''}`}
                  onClick={() => setFormData({ ...formData, education: level.id })}
                >
                  <div className={styles.educationRadio}>
                    {formData.education === level.id && <div className={styles.educationRadioFill}></div>}
                  </div>
                  <span>{level.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.stepActions}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(3)}
                disabled={!formData.education}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Skills Input */}
        {step === 3 && (
          <div className={styles.stepContainer}>
            <div className={styles.stepHeader}>
              <span className="section-label">Step 3 of 3</span>
              <h1 className="section-title">Tell us what you can do.</h1>
              <p className="section-subtitle">Describe your skills, work experience, and things you&apos;ve learned — formal or informal. Be specific about what you actually do.</p>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Your Skills & Experience</label>
              <textarea
                className={styles.textarea}
                placeholder="Example: I repair mobile phones. I speak three languages. I taught myself Python from YouTube. I help manage inventory at my aunt's shop..."
                value={formData.skillsText}
                onChange={e => setFormData({ ...formData, skillsText: e.target.value })}
                rows={8}
              />
              <div className={styles.textareaHint}>
                💡 Tip: Include both formal and informal skills. Mention specific tools, languages, and technologies you use. The more detail, the better the mapping.
              </div>
            </div>

            <div className={styles.promptCards}>
              <p className={styles.promptTitle}>Not sure what to include? Try these prompts:</p>
              <div className={styles.promptGrid}>
                {[
                  "What work do you do every day?",
                  "What tools or equipment do you use?",
                  "What languages do you speak?",
                  "What have you taught yourself?",
                  "What do people ask you to help with?",
                  "What would you like to learn next?",
                ].map((prompt, i) => (
                  <div key={i} className={`${styles.promptChip} chip`}>{prompt}</div>
                ))}
              </div>
            </div>

            <div className={styles.stepActions}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleSubmit('/assess')}
                disabled={!formData.skillsText || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className={styles.spinner}></span>
                    Preparing Assessment...
                  </>
                ) : (
                  "🪞 Verify My Skills →"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
