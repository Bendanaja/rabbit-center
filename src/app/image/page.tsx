'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ImagePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/studios');
  }, [router]);

  return null;
}
