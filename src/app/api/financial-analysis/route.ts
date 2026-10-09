import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // --------------------------------------------------
    // 1. Get logged-in user
    // --------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Get business ID
    // --------------------------------------------------
    const contentType = request.headers.get("content-type") || "";

let businessId: string | null = null;

if (contentType.includes("application/json")) {
  const body = await request.json();
  businessId = body.businessId;
} else {
  const formData = await request.formData();
  const value = formData.get("businessId");

  if (typeof value === "string") {
    businessId = value;
  }
}

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Load business
    // --------------------------------------------------
    const { data: business, error: businessError } =
      await supabase
        .from("businesses")
        .select(`
          id,
          entrepreneur_id,
          monthly_revenue,
          monthly_expenses,
          funding_required
        `)
        .eq("id", businessId)
        .single();

    if (businessError) {
      return NextResponse.json(
        { error: businessError.message },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. Verify entrepreneur owns the business
    // --------------------------------------------------
    if (business.entrepreneur_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to analyze this business.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 5. Get latest progress update
    // --------------------------------------------------

    // --------------------------------------------------
    // 5. Get latest progress update
    // --------------------------------------------------
    const { data: progress, error: progressError } =
  await supabase
    .from("progress_updates")
    .select(`
      reporting_month,
      revenue,
      expenses,
      profit,
      created_at
    `)
    .eq("business_id", businessId)
    .order("reporting_month", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

if (progressError) {
  return NextResponse.json(
    { error: progressError.message },
    { status: 500 }
  );
}
    // --------------------------------------------------
    // 6. Determine financial values
    // --------------------------------------------------
    const monthlyRevenue =
      progress?.revenue ??
      business.monthly_revenue ??
      0;

    const monthlyExpenses =
      progress?.expenses ??
      business.monthly_expenses ??
      0;

    const monthlyProfit =
      progress?.profit ??
      monthlyRevenue - monthlyExpenses;

    const fundingRequired =
      business.funding_required ?? 0;

    // --------------------------------------------------
    // 7. Calculate profit margin
    // --------------------------------------------------
    const profitMargin =
      monthlyRevenue > 0
        ? (monthlyProfit / monthlyRevenue) * 100
        : 0;

    // --------------------------------------------------
    // 8. Calculate break-even period
    // --------------------------------------------------
    let breakEvenMonths: number | null = null;

    if (monthlyProfit > 0 && fundingRequired > 0) {
      breakEvenMonths =
        fundingRequired / monthlyProfit;
    }

    // --------------------------------------------------
    // 9. Calculate financial health score
    // --------------------------------------------------
    let financialHealthScore = 50;

    if (monthlyRevenue > 0) {
      financialHealthScore += 15;
    }

    if (monthlyProfit > 0) {
      financialHealthScore += 20;
    } else {
      financialHealthScore -= 20;
    }

    if (profitMargin >= 20) {
      financialHealthScore += 15;
    } else if (profitMargin >= 10) {
      financialHealthScore += 8;
    } else if (profitMargin < 0) {
      financialHealthScore -= 15;
    }

    financialHealthScore = Math.max(
      0,
      Math.min(100, financialHealthScore)
    );

    // --------------------------------------------------
    // 10. Generate financial summary
    // --------------------------------------------------
    let aiSummary = "";

    if (
      monthlyProfit > 0 &&
      profitMargin >= 20
    ) {
      aiSummary =
        "The business is currently profitable with a healthy profit margin. Financial performance indicates positive operating efficiency.";
    } else if (monthlyProfit > 0) {
      aiSummary =
        "The business is profitable, although the current profit margin suggests there may be opportunities to improve operating efficiency.";
    } else if (monthlyRevenue > 0) {
      aiSummary =
        "The business is generating revenue but is currently operating with limited or negative profitability. Expense management should be reviewed.";
    } else {
      aiSummary =
        "There is not enough recent financial data to determine the business's financial performance.";
    }

    // --------------------------------------------------
    // 11. Generate recommendations
    // --------------------------------------------------
    const recommendations: string[] = [];

    if (monthlyProfit <= 0) {
      recommendations.push(
        "Focus on reducing unnecessary operating expenses."
      );
    }

    if (
      profitMargin < 10 &&
      monthlyRevenue > 0
    ) {
      recommendations.push(
        "Look for ways to improve pricing, sales volume, or operating efficiency."
      );
    }

    if (profitMargin >= 20) {
      recommendations.push(
        "Maintain the current cost structure while exploring opportunities for controlled expansion."
      );
    }

    if (
      fundingRequired > 0 &&
      breakEvenMonths !== null
    ) {
      recommendations.push(
        `Estimated funding recovery period is approximately ${breakEvenMonths.toFixed(
          1
        )} months.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Continue tracking monthly financial performance to improve decision-making."
      );
    }

    // --------------------------------------------------
    // 12. Save analysis
    // --------------------------------------------------
    const { data: analysis, error: analysisError } =
      await supabase
        .from("business_analysis")
        .upsert(
          {
            business_id: businessId,
            monthly_revenue: monthlyRevenue,
            monthly_expenses: monthlyExpenses,
            monthly_profit: monthlyProfit,
            profit_margin: profitMargin,
            funding_required: fundingRequired,
            break_even_months: breakEvenMonths,
            financial_health_score:
              financialHealthScore,
            ai_summary: aiSummary,
            ai_recommendations: recommendations,
            calculated_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "business_id",
          }
        )
        .select()
        .single();

    if (analysisError) {
      return NextResponse.json(
        { error: analysisError.message },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 13. Return analysis
    // --------------------------------------------------
    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}
