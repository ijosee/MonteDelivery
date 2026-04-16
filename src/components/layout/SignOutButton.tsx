'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      Salir
    </button>
  );
}
