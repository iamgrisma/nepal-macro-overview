/** Indicator descriptions, keyed by code (shared by all pages). */
export const DESCRIPTIONS = {
  'NY.GDP.MKTP.CD': 'Nominal gross domestic product in current US dollars — the total market value of all goods and services produced in Nepal.',
  'NY.GDP.MKTP.KD.ZG': 'Annual percentage growth of GDP at constant prices, stripping out inflation.',
  'NY.GDP.PCAP.CD': 'GDP divided by mid-year population, in current US dollars.',
  'NY.GNP.PCAP.CD': 'Gross national income per capita using the World Bank Atlas conversion method.',
  'FP.CPI.TOTL.ZG': 'Annual change in the cost to the average consumer of a basket of goods and services.',
  'SL.UEM.TOTL.ZS': 'Share of the labor force that is without work but available for and seeking employment (ILO modeled estimate).',
  'BX.TRF.PWKR.CD.DT': 'Personal transfers and compensation of employees received from abroad, in current US dollars.',
  'BX.TRF.PWKR.DT.GD.ZS': 'Remittance inflows relative to GDP — a lifeline of the Nepali economy and one of the highest ratios in the world.',
  'BX.KLT.DINV.CD.WD': 'Net foreign direct investment inflows into Nepal, balance-of-payments basis, current US dollars.',
  'NE.EXP.GNFS.ZS': 'Value of all goods and services provided to the rest of the world, as a share of GDP.',
  'NE.IMP.GNFS.ZS': 'Value of all goods and services received from the rest of the world, as a share of GDP.',
  'BN.CAB.XOKA.GD.ZS': 'Net trade in goods and services plus net income and current transfers, as a share of GDP.',
  'DT.DOD.DECT.CD': 'Debt owed to nonresidents repayable in currency, goods, or services — disbursed and outstanding, current US dollars.',
  'SP.POP.TOTL': 'Total mid-year population based on the de facto definition.',
  'SI.POV.NAHC': 'Share of the population living below the national poverty line.',
  'GC.DOD.TOTL.GD.ZS': 'Total central government debt (domestic and external) relative to GDP.',
  'NE.GDI.TOTL.ZS': 'Investment: gross fixed capital formation plus changes in inventories, as a share of GDP.',
  'FS.AST.PRVT.GD.ZS': 'Financial resources provided to the private sector by banks and other financial institutions, as a share of GDP.',
  'FM.LBL.BMNY.GD.ZS': 'Broad money (currency plus deposits, roughly M2) relative to GDP — a gauge of financial depth.',
  'NGDP_RPCH': 'IMF World Economic Outlook: real GDP growth, including staff projections for future years.',
  'PCPIPCH': 'IMF World Economic Outlook: average consumer price inflation, including staff projections.',
  'NGDPD': 'IMF World Economic Outlook: nominal GDP in US dollars, including staff projections.',
  'NGDPDPC': 'IMF World Economic Outlook: nominal GDP per capita in US dollars, including staff projections.',
  'BCA_NGDPD': 'IMF World Economic Outlook: current account balance as a share of GDP, including staff projections.',
  'GGXWDG_NGDP': 'IMF World Economic Outlook: general government gross debt as a share of GDP, including staff projections.',
};

export const SOURCE_LABELS = {
  world_bank: 'World Bank, World Development Indicators',
  imf_weo: 'IMF, World Economic Outlook (includes projections)',
};

export const SOURCE_URLS = {
  world_bank: 'https://data.worldbank.org/country/nepal',
  imf_weo: 'https://www.imf.org/en/Publications/WEO',
};

export const CATEGORIES = {
  growth: 'Growth & Output',
  prices: 'Prices',
  external: 'External Sector',
  fiscal: 'Fiscal & Debt',
  debt: 'External Debt',
  financial: 'Financial Sector',
  social: 'People & Society',
};
