const MIN_PHONE_DIGITS = 8;

export function normalizeWhatsAppPhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`;
  }

  return digits.length >= MIN_PHONE_DIGITS ? digits : null;
}

export function createWhatsAppChatUrl(phone: string): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : null;
}
