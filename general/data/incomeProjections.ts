export interface IncomeProjection {
    id: string;
    month: string;
    year: number;
    monthIndex: number; // 0-13 for feb-2026 to mar-2027
    sources: {
        violao: number;
        bartender: number;
        eletron: number;
    };
    total: number;
    carFundPossible: boolean;
    growthBadges: string[];
}

// Helper function to calculate Eletron's compound growth
const calculateEletronGrowth = (baseValue: number, monthsPassed: number): number => {
    return Math.round(baseValue * Math.pow(1.1, monthsPassed));
};

export const incomeProjections: IncomeProjection[] = [
    // Feb 2026 - START
    {
        id: "feb-2026",
        month: "FEV",
        year: 2026,
        monthIndex: 0,
        sources: {
            violao: 1200,
            bartender: 800,
            eletron: 600
        },
        total: 2600,
        carFundPossible: false,
        growthBadges: ["START"]
    },
    // Mar 2026
    {
        id: "mar-2026",
        month: "MAR",
        year: 2026,
        monthIndex: 1,
        sources: {
            violao: 1200,
            bartender: 850,
            eletron: calculateEletronGrowth(600, 1) // 660
        },
        total: 2710,
        carFundPossible: false,
        growthBadges: []
    },
    // Apr 2026
    {
        id: "apr-2026",
        month: "ABR",
        year: 2026,
        monthIndex: 2,
        sources: {
            violao: 1200,
            bartender: 900,
            eletron: calculateEletronGrowth(600, 2) // 726
        },
        total: 2826,
        carFundPossible: false,
        growthBadges: []
    },
    // May 2026
    {
        id: "may-2026",
        month: "MAI",
        year: 2026,
        monthIndex: 3,
        sources: {
            violao: 1200,
            bartender: 950,
            eletron: calculateEletronGrowth(600, 3) // 799
        },
        total: 2949,
        carFundPossible: false,
        growthBadges: []
    },
    // Jun 2026
    {
        id: "jun-2026",
        month: "JUN",
        year: 2026,
        monthIndex: 4,
        sources: {
            violao: 1200,
            bartender: 1000,
            eletron: calculateEletronGrowth(600, 4) // 879
        },
        total: 3079,
        carFundPossible: true,
        growthBadges: ["3K+"]
    },
    // Jul 2026
    {
        id: "jul-2026",
        month: "JUL",
        year: 2026,
        monthIndex: 5,
        sources: {
            violao: 1200,
            bartender: 1050,
            eletron: calculateEletronGrowth(600, 5) // 967
        },
        total: 3217,
        carFundPossible: true,
        growthBadges: []
    },
    // Aug 2026
    {
        id: "aug-2026",
        month: "AGO",
        year: 2026,
        monthIndex: 6,
        sources: {
            violao: 1200,
            bartender: 1100,
            eletron: calculateEletronGrowth(600, 6) // 1064
        },
        total: 3364,
        carFundPossible: true,
        growthBadges: []
    },
    // Sep 2026
    {
        id: "sep-2026",
        month: "SET",
        year: 2026,
        monthIndex: 7,
        sources: {
            violao: 1200,
            bartender: 1150,
            eletron: calculateEletronGrowth(600, 7) // 1170
        },
        total: 3520,
        carFundPossible: true,
        growthBadges: []
    },
    // Oct 2026
    {
        id: "oct-2026",
        month: "OUT",
        year: 2026,
        monthIndex: 8,
        sources: {
            violao: 1200,
            bartender: 1200,
            eletron: calculateEletronGrowth(600, 8) // 1287
        },
        total: 3687,
        carFundPossible: true,
        growthBadges: []
    },
    // Nov 2026
    {
        id: "nov-2026",
        month: "NOV",
        year: 2026,
        monthIndex: 9,
        sources: {
            violao: 1200,
            bartender: 1250,
            eletron: calculateEletronGrowth(600, 9) // 1416
        },
        total: 3866,
        carFundPossible: true,
        growthBadges: []
    },
    // Dec 2026 - PEAK SEASON
    {
        id: "dec-2026",
        month: "DEZ",
        year: 2026,
        monthIndex: 10,
        sources: {
            violao: 1500, // Festas bonus
            bartender: 2500, // Doubled (1300 * 2, approximately)
            eletron: calculateEletronGrowth(600, 10) // 1558
        },
        total: 5558,
        carFundPossible: true,
        growthBadges: ["PEAK", "5K+"]
    },
    // Jan 2027
    {
        id: "jan-2027",
        month: "JAN",
        year: 2027,
        monthIndex: 11,
        sources: {
            violao: 1200,
            bartender: 1350,
            eletron: calculateEletronGrowth(600, 11) // 1714
        },
        total: 4264,
        carFundPossible: true,
        growthBadges: ["4K+"]
    },
    // Feb 2027
    {
        id: "feb-2027",
        month: "FEV",
        year: 2027,
        monthIndex: 12,
        sources: {
            violao: 1200,
            bartender: 1400,
            eletron: calculateEletronGrowth(600, 12) // 1885
        },
        total: 4485,
        carFundPossible: true,
        growthBadges: []
    },
    // Mar 2027 - TARGET MONTH (1 year anniversary)
    {
        id: "mar-2027",
        month: "MAR",
        year: 2027,
        monthIndex: 13,
        sources: {
            violao: 1200,
            bartender: 1450,
            eletron: calculateEletronGrowth(600, 13) // 2074
        },
        total: 4724,
        carFundPossible: true,
        growthBadges: ["TARGET"]
    }
];

// Calculate totals for each source
incomeProjections.forEach(projection => {
    projection.total = projection.sources.violao + projection.sources.bartender + projection.sources.eletron;
});
