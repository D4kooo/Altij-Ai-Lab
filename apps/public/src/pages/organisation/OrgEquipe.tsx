import { Users } from 'lucide-react';

export function OrgEquipe() {
  return (
    <div className="px-6 lg:px-10 pt-36 pb-8 lg:pb-12">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase block mb-3">
          Équipe
        </span>
        <h1
          className="font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Gestion d'équipe
        </h1>
        <p className="mt-2 text-black/40 text-sm">
          Invitez et gérez les accès de vos collaborateurs.
        </p>
      </div>

      {/* Invite section */}
      <div className="border-[2px] border-black p-8 lg:p-10 mb-0">
        <div className="flex items-start gap-6">
          <div className="w-12 h-12 border-2 border-black flex items-center justify-center shrink-0">
            <Users size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2
              className="font-bold text-xl tracking-tighter mb-2"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              Invitez vos collaborateurs
            </h2>
            <p className="text-black/40 text-sm leading-relaxed mb-6">
              Permettez à votre équipe d'accéder aux formations et aux outils de conformité.
              Chaque membre pourra suivre son propre parcours et contribuer à la conformité de l'organisation.
            </p>
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-black font-mono text-[10px] tracking-[0.15em] uppercase opacity-40 cursor-not-allowed"
            >
              Inviter un membre
            </button>
          </div>
        </div>
      </div>

      {/* Coming soon */}
      <div className="border-[2px] border-black border-t-0 p-8 lg:p-10 text-center">
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA] uppercase block mb-3">
          Bientôt disponible
        </span>
        <p className="text-black/30 text-sm max-w-md mx-auto">
          La gestion d'équipe est en cours de développement.
          Vous pourrez bientôt inviter des collaborateurs, suivre leur progression
          et gérer les rôles au sein de votre organisation.
        </p>
      </div>
    </div>
  );
}

export default OrgEquipe;
