import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Noma'lum sahifalarni /operator ga yo'naltirish
    setLocation("/operator");
  }, [setLocation]);

  return null;
}
