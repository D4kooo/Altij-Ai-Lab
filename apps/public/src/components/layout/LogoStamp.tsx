import { NavLink } from 'react-router-dom';

export function LogoStamp() {
  return (
    <NavLink
      to="/"
      className="hidden sm:flex fixed top-1 left-6 lg:left-10 z-[60] w-32 h-28 bg-white border-2 border-black items-center justify-center hover:bg-black group transition-colors duration-200"
      style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
      aria-label="Retour à l'accueil Dataring"
    >
      <img
        src="/assets/logo-dataring-black.png"
        alt="Dataring"
        className="h-16 group-hover:hidden"
      />
      <img
        src="/assets/logo-dataring.png"
        alt="Dataring"
        className="h-16 hidden group-hover:block"
      />
    </NavLink>
  );
}
