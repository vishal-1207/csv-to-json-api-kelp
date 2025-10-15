import { query } from "../config/db.config.js";

/**
 * Calculates the age distribution of users in the database and prints a formatted report to the console.
 */
export const generateAgeDistributionReport = async () => {
  const reportQuery = `
    WITH AgeGroups AS (
      SELECT
        CASE
          WHEN age < 20 THEN '< 20'
          WHEN age BETWEEN 20 AND 40 THEN '20 to 40'
          WHEN age BETWEEN 41 AND 60 THEN '40 to 60'
          WHEN age > 60 THEN '> 60'
        END AS age_group
      FROM public.users
      WHERE age IS NOT NULL
    ),
    GroupCounts AS (
      SELECT
        age_group,
        COUNT(*) AS count
      FROM AgeGroups
      GROUP BY age_group
    ),
    TotalCount AS (
      SELECT COUNT(*) AS total FROM public.users WHERE age IS NOT NULL
    )
    SELECT
      gc.age_group,
      ROUND((gc.count::decimal / tc.total) * 100, 2) AS percentage_distribution
    FROM GroupCounts gc, TotalCount tc
    ORDER BY
      CASE
        WHEN gc.age_group = '< 20' THEN 1
        WHEN gc.age_group = '20 to 40' THEN 2
        WHEN gc.age_group = '40 to 60' THEN 3
        WHEN gc.age_group = '> 60' THEN 4
      END;
  `;

  try {
    const { rows } = await query(reportQuery);

    console.log("\n--- Age Distribution Report ---");
    console.log("Age-Group         % Distribution");
    console.log("-----------------------------------");

    const reportMap = {
      "< 20": "0.00",
      "20 to 40": "0.00",
      "40 to 60": "0.00",
      "> 60": "0.00",
    };

    rows.forEach((row) => {
      if (row.age_group) {
        reportMap[row.age_group] = row.percentage_distribution;
      }
    });

    for (const group in reportMap) {
      const padding = " ".repeat(18 - group.length);
      console.log(`${group}${padding}${reportMap[group]}`);
    }
    console.log("-----------------------------------");
  } catch (error) {
    console.error("Error generating age distribution report:", error);
  }
};
