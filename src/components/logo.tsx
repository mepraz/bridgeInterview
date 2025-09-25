import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2" prefetch={false}>
      <GraduationCap className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold font-headline tracking-tight">PTE Ace</span>
    </Link>
  );
};

export default Logo;
