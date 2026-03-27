export function getZodiacSign(birthday: string | undefined): string {
  if (!birthday) return '';
  
  // Parse the birthday string (format: "Month Day")
  const parts = birthday.split(' ');
  if (parts.length !== 2) return '';
  
  const month = parts[0].toLowerCase();
  const day = parseInt(parts[1], 10);
  
  if (isNaN(day)) return '';
  
  // Determine zodiac sign based on month and day
  if ((month === 'march' && day >= 21) || (month === 'april' && day <= 19)) {
    return 'Aries';
  } else if ((month === 'april' && day >= 20) || (month === 'may' && day <= 20)) {
    return 'Taurus';
  } else if ((month === 'may' && day >= 21) || (month === 'june' && day <= 20)) {
    return 'Gemini';
  } else if ((month === 'june' && day >= 21) || (month === 'july' && day <= 22)) {
    return 'Cancer';
  } else if ((month === 'july' && day >= 23) || (month === 'august' && day <= 22)) {
    return 'Leo';
  } else if ((month === 'august' && day >= 23) || (month === 'september' && day <= 22)) {
    return 'Virgo';
  } else if ((month === 'september' && day >= 23) || (month === 'october' && day <= 22)) {
    return 'Libra';
  } else if ((month === 'october' && day >= 23) || (month === 'november' && day <= 21)) {
    return 'Scorpio';
  } else if ((month === 'november' && day >= 22) || (month === 'december' && day <= 21)) {
    return 'Sagittarius';
  } else if ((month === 'december' && day >= 22) || (month === 'january' && day <= 19)) {
    return 'Capricorn';
  } else if ((month === 'january' && day >= 20) || (month === 'february' && day <= 18)) {
    return 'Aquarius';
  } else if ((month === 'february' && day >= 19) || (month === 'march' && day <= 20)) {
    return 'Pisces';
  }
  
  return '';
}

export function getZodiacEmoji(zodiacSign: string | undefined): string {
  if (!zodiacSign) return '🎯';
  
  switch (zodiacSign.toLowerCase()) {
    case 'aries':
      return '♈';
    case 'taurus':
      return '♉';
    case 'gemini':
      return '♊';
    case 'cancer':
      return '♋';
    case 'leo':
      return '♌';
    case 'virgo':
      return '♍';
    case 'libra':
      return '♎';
    case 'scorpio':
      return '♏';
    case 'sagittarius':
      return '♐';
    case 'capricorn':
      return '♑';
    case 'aquarius':
      return '♒';
    case 'pisces':
      return '♓';
    default:
      return '🎯';
  }
}