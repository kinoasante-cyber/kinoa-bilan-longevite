export const AGE_OPTS = ['50-59', '60-64', '65-69', '70-74', '75+']

// Steffen et al. 2002 ; Podsiadlo & Richardson 1991 (TUG, secondes — lower is better)
// Springer et al. 2007 (SLS, secondes — higher is better)
// Bohannon 2006 ; SHARE 2025 (5×STS, secondes — lower is better)
// Enright & Sherrill 1998 (6MWT, mètres — higher is better)
export const NORMS = {
  tug: {
    '50-59': { H: { good: 9.5,  ok: 12.0 }, F: { good: 9.5,  ok: 12.0 } },
    '60-64': { H: { good: 10.0, ok: 13.0 }, F: { good: 10.5, ok: 13.5 } },
    '65-69': { H: { good: 10.5, ok: 14.0 }, F: { good: 11.0, ok: 14.5 } },
    '70-74': { H: { good: 11.0, ok: 15.0 }, F: { good: 12.0, ok: 15.5 } },
    '75+':   { H: { good: 12.0, ok: 17.0 }, F: { good: 13.0, ok: 18.0 } },
  },
  sls: {
    '50-59': { H: { good: 40, ok: 20 }, F: { good: 35, ok: 15 } },
    '60-64': { H: { good: 35, ok: 15 }, F: { good: 28, ok: 12 } },
    '65-69': { H: { good: 28, ok: 12 }, F: { good: 22, ok: 8  } },
    '70-74': { H: { good: 20, ok: 8  }, F: { good: 16, ok: 6  } },
    '75+':   { H: { good: 14, ok: 5  }, F: { good: 11, ok: 4  } },
  },
  sts5: {
    '50-59': { H: { good: 11.0, ok: 14.0 }, F: { good: 12.0, ok: 15.0 } },
    '60-64': { H: { good: 12.0, ok: 15.0 }, F: { good: 13.0, ok: 17.0 } },
    '65-69': { H: { good: 12.5, ok: 16.0 }, F: { good: 14.0, ok: 18.0 } },
    '70-74': { H: { good: 13.5, ok: 17.0 }, F: { good: 15.0, ok: 19.5 } },
    '75+':   { H: { good: 15.0, ok: 19.0 }, F: { good: 17.0, ok: 22.0 } },
  },
  tandem: { goodTime: 28, maxErrors: 1 },
  mwt6: {
    '50-59': { H: { good: 550, ok: 450 }, F: { good: 500, ok: 400 } },
    '60-64': { H: { good: 530, ok: 430 }, F: { good: 480, ok: 380 } },
    '65-69': { H: { good: 510, ok: 410 }, F: { good: 455, ok: 355 } },
    '70-74': { H: { good: 485, ok: 385 }, F: { good: 425, ok: 325 } },
    '75+':   { H: { good: 450, ok: 350 }, F: { good: 385, ok: 285 } },
  },
}

export const wrap = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '1.5rem 1rem 5rem',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: '#F9F7F4',
  minHeight: '100vh',
}
