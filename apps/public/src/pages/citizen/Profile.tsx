import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Award } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CertificateDiploma } from '@/components/CertificateDiploma';

type Audience = 'juniors' | 'adultes' | 'seniors';
const AUDIENCES: { key: Audience; label: string; sub: string }[] = [
  { key: 'juniors', label: 'Juniors', sub: '12-15 ans' },
  { key: 'adultes', label: 'Adultes', sub: '16-60 ans' },
  { key: 'seniors', label: 'Seniors', sub: '60+ ans' },
];

function CertificationTracker({ audience, audienceLabel, onViewCertificate }: { audience: Audience; audienceLabel: string; onViewCertificate: (courseName: string, audienceLabel: string) => void }) {
  const { courses, allModules } = useCoursesData(audience);
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();

  const totalModules = allModules.length;
  const completedCount = getCompletedCount(audience);
  const isComplete = totalModules > 0 && completedCount >= totalModules;
  const progress = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const courseModules = allModules.filter((m) => m.courseName === course.name);
        const courseCompleted = courseModules.filter((m) => isModuleCompleted(audience, m.id)).length;
        const courseTotal = courseModules.length;
        const courseDone = courseTotal > 0 && courseCompleted >= courseTotal;

        return (
          <div key={course.id} className="flex items-center gap-3 py-2 border-b border-black/10">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {courseDone && <Check size={12} strokeWidth={2.5} className="text-brand-turquoise shrink-0" aria-hidden="true" />}
              <span className={`font-mono text-[10px] tracking-[0.1em] uppercase truncate ${courseDone ? 'text-brand-turquoise' : 'text-black/70'}`}>
                {course.name}
              </span>
            </div>
            {courseDone ? (
              <button
                onClick={() => onViewCertificate(course.name, audienceLabel)}
                className="font-mono text-[9px] tracking-[0.1em] uppercase text-brand-turquoise hover:text-brand-turquoise-dark border border-brand-turquoise/30 hover:border-brand-turquoise px-2 py-0.5 transition-colors duration-100 shrink-0"
              >
                Diplôme
              </button>
            ) : (
              <span className="font-mono text-[10px] text-black/50 shrink-0">
                {courseCompleted}/{courseTotal}
              </span>
            )}
          </div>
        );
      })}

      {/* Parcours certification status */}
      {totalModules > 0 && (
        <div className={`mt-4 pt-3 flex items-center gap-3 ${isComplete ? 'border-t-2 border-brand-turquoise' : ''}`}>
          <div className={`w-9 h-9 flex items-center justify-center ${isComplete ? 'bg-brand-turquoise text-white' : 'bg-black/5 text-black/25'}`}>
            <Award size={18} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <span className={`font-mono text-[11px] tracking-[0.1em] uppercase font-medium ${isComplete ? 'text-brand-turquoise' : 'text-black/50'}`}>
              {isComplete ? 'Certification obtenue' : `${progress}% complété`}
            </span>
          </div>
          <span className="font-mono text-[10px] text-black/50">
            {completedCount}/{totalModules}
          </span>
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const { user, checkAuth } = useAuthStore();

  // Edit form
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [orgName, setOrgName] = useState(user?.organizationName || '');
  const [orgRole, setOrgRole] = useState(user?.organizationRole || '');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Certificate modal
  const [certModal, setCertModal] = useState<{ courseName: string; audienceLabel: string } | null>(null);

  const isOrg = user?.accountType === 'organisation';
  const backTo = isOrg ? '/org' : '/school';

  async function handleSaveProfile() {
    setSaving(true);
    setProfileMsg(null);
    try {
      await authApi.updateProfile({
        firstName,
        lastName,
        email,
        ...(isOrg ? { organizationName: orgName, organizationRole: orgRole } : {}),
      });
      await checkAuth();
      setEditing(false);
      setProfileMsg({ type: 'success', text: 'Profil mis à jour' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setShowPwForm(false);
      setPwMsg({ type: 'success', text: 'Mot de passe modifié' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100svh-3.5rem)]">

      {/* LEFT PANEL — Mon Profil (fixed, no scroll) */}
      <div className="lg:w-1/2 lg:overflow-hidden px-6 lg:px-10 py-8 lg:py-10 sm:pt-20">
        <div className="max-w-lg ml-auto lg:mr-12">
          {/* Back */}
          <NavLink to={backTo} className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/50 hover:text-black transition-colors duration-100 mb-8">
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" /> Retour
          </NavLink>

          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-10">
            Mon profil
          </h1>

          <div className="space-y-8">

            {/* Profile info */}
            <section>
              <div className="border-t-[2px] border-black pt-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase">Informations</span>
                  {!editing && (
                    <button
                      onClick={() => { setEditing(true); setProfileMsg(null); }}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase text-black/50 hover:text-black border border-black/20 hover:border-black px-3 py-1.5 transition-colors duration-100"
                    >
                      Modifier
                    </button>
                  )}
                </div>

                {profileMsg && (
                  <div className={`mb-4 px-3 py-2 font-mono text-[10px] tracking-[0.1em] ${profileMsg.type === 'success' ? 'bg-brand-turquoise/10 text-brand-turquoise' : 'border-2 border-black bg-black/5 text-black'}`}>
                    {profileMsg.text}
                  </div>
                )}

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profile-firstName">Prénom</Label>
                        <Input id="profile-firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="profile-lastName">Nom</Label>
                        <Input id="profile-lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="profile-email">Email</Label>
                      <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    {isOrg && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="profile-orgName">Organisation</Label>
                          <Input id="profile-orgName" type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="profile-orgRole">Rôle</Label>
                          <Input id="profile-orgRole" type="text" value={orgRole} onChange={(e) => setOrgRole(e.target.value)} />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-2.5 bg-black text-white font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-black/80 transition-colors duration-100 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" aria-label="Enregistrement en cours" /> : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFirstName(user?.firstName || '');
                          setLastName(user?.lastName || '');
                          setEmail(user?.email || '');
                          setOrgName(user?.organizationName || '');
                          setOrgRole(user?.organizationRole || '');
                        }}
                        className="px-6 py-2.5 border-2 border-black/15 font-mono text-[10px] tracking-[0.15em] uppercase text-black/60 hover:border-black hover:text-black transition-colors duration-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Prénom</Label>
                        <p className="font-heading text-base">{user?.firstName}</p>
                      </div>
                      <div>
                        <Label>Nom</Label>
                        <p className="font-heading text-base">{user?.lastName}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="font-heading text-base">{user?.email}</p>
                    </div>
                    {isOrg && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Organisation</Label>
                          <p className="font-heading text-base">{user?.organizationName || '—'}</p>
                        </div>
                        <div>
                          <Label>Rôle</Label>
                          <p className="font-heading text-base">{user?.organizationRole || '—'}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Type de compte</Label>
                      <p className="font-heading text-base">
                        {user?.accountType === 'organisation' ? 'Organisation' : 'Particulier'}
                      </p>
                    </div>
                    <div>
                      <Label>Membre depuis</Label>
                      <p className="font-heading text-base">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Password */}
            <section>
              <div className="border-t-[2px] border-black pt-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-black/50 uppercase">Mot de passe</span>
                  {!showPwForm && (
                    <button
                      onClick={() => { setShowPwForm(true); setPwMsg(null); }}
                      className="font-mono text-[10px] tracking-[0.15em] uppercase text-black/50 hover:text-black border border-black/20 hover:border-black px-3 py-1.5 transition-colors duration-100"
                    >
                      Changer
                    </button>
                  )}
                </div>

                {pwMsg && (
                  <div className={`mb-4 px-3 py-2 font-mono text-[10px] tracking-[0.1em] ${pwMsg.type === 'success' ? 'bg-brand-turquoise/10 text-brand-turquoise' : 'border-2 border-black bg-black/5 text-black'}`}>
                    {pwMsg.text}
                  </div>
                )}

                {showPwForm && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pw-current">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="pw-current"
                          type={showCurrentPw ? 'text' : 'password'}
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black p-1"
                          aria-label={showCurrentPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pw-new">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="pw-new"
                          type={showNewPw ? 'text' : 'password'}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black p-1"
                          aria-label={showNewPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <span className="font-mono text-[9px] text-black/60 mt-1.5 block">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial</span>
                    </div>
                    <div>
                      <Label htmlFor="pw-confirm">Confirmer</Label>
                      <Input
                        id="pw-confirm"
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                        className="px-6 py-2.5 bg-black text-white font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-black/80 transition-colors duration-100 disabled:opacity-50"
                      >
                        {pwSaving ? <Loader2 size={14} className="animate-spin" aria-label="Modification en cours" /> : 'Modifier'}
                      </button>
                      <button
                        onClick={() => { setShowPwForm(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                        className="px-6 py-2.5 border-2 border-black/15 font-mono text-[10px] tracking-[0.15em] uppercase text-black/60 hover:border-black hover:text-black transition-colors duration-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Mes Certifications (scrollable) */}
      <div className="lg:w-1/2 lg:border-l-[2px] lg:border-black lg:overflow-y-auto px-6 lg:px-10 py-8 lg:py-10 sm:pt-20">
        <div className="max-w-lg lg:ml-12">
          {/* Spacer to align with left panel title (matches back link height) */}
          <div className="hidden lg:block mb-8 h-[14px]" />

          <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-10">
            Mes certifications
          </h1>

          <div className="space-y-10">
            {AUDIENCES.map((a) => (
              <div key={a.key}>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-heading text-base font-bold tracking-tight">
                    {a.label}
                  </span>
                  <span className="font-mono text-[9px] text-black/60 tracking-[0.1em]">{a.sub}</span>
                </div>
                <CertificationTracker
                  audience={a.key}
                  audienceLabel={a.label}
                  onViewCertificate={(courseName, audienceLabel) => setCertModal({ courseName, audienceLabel })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {certModal && (
        <CertificateDiploma
          userName={`${user?.firstName || ''} ${user?.lastName || ''}`}
          audienceLabel={certModal.audienceLabel}
          courseName={certModal.courseName}
          completedDate={new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          onClose={() => setCertModal(null)}
        />
      )}
    </div>
  );
}
