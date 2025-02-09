import React from 'react';
import { ThemeToggle } from './ThemeToggle';

export function AuthHeader() {
  return (
    <div className="fixed top-0 right-0 p-4">
      <ThemeToggle />
    </div>
  );
} 