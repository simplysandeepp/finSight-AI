import pathlib
p = pathlib.Path(r'd:\finsight-ai\backend\orchestrator\orchestrate.py')
t = p.read_text(encoding='utf-8')

old_chunk = """                revenue_current = safe_revenue(latest, 100)
                revenue_lag_1q = safe_revenue(quarters[1] if len(quarters) > 1 else None, revenue_current * 0.98)
                revenue_lag_2q = safe_revenue(quarters[2] if len(quarters) > 2 else None, revenue_current * 0.96)
                revenue_lag_4q = safe_revenue(quarters[4] if len(quarters) > 4 else None, revenue_current * 0.92)
                
                # Revenue growth calculations
                revenue_growth_yoy = (revenue_current - revenue_lag_4q) / revenue_lag_4q if revenue_lag_4q > 0 else 0.05
                revenue_growth_qoq = (revenue_current - revenue_lag_1q) / revenue_lag_1q if revenue_lag_1q > 0 else 0.02"""

new_chunk = """                from datetime import datetime, timedelta
                
                # 1. Sort quarters strictly by date (newest first)
                valid_quarters = [q for q in quarters if q.get("date")]
                sorted_quarters = sorted(valid_quarters, key=lambda x: x["date"], reverse=True)

                # 2. Helper function for Time-Based Lookup
                def get_quarter_by_lag(quarters_list, base_date_str, months_lag):
                    if not base_date_str: 
                        return None
                    base_date = datetime.strptime(base_date_str, "%Y-%m-%d")
                    target_date = base_date - timedelta(days=months_lag * 30) # Approx days

                    best_match = None
                    min_diff = 9999
                    
                    for q in quarters_list:
                        q_date = datetime.strptime(q["date"], "%Y-%m-%d")
                        diff_days = abs((q_date - target_date).days)
                        # Only accept if it's within a ~45 day window of the target quarter
                        if diff_days < 45 and diff_days < min_diff:
                            best_match = q
                            min_diff = diff_days
                            
                    return best_match

                # 3. Find specific lagged quarters chronologically
                q_lag_1 = get_quarter_by_lag(sorted_quarters, latest.get("date"), 3)
                q_lag_2 = get_quarter_by_lag(sorted_quarters, latest.get("date"), 6)
                q_lag_4 = get_quarter_by_lag(sorted_quarters, latest.get("date"), 12)

                # 4. Extract variables with smart sequential imputation
                revenue_current = safe_revenue(latest, 100)

                # If lag_1 is missing, base it on lag_2 if available, else current
                if q_lag_1:
                    revenue_lag_1q = safe_revenue(q_lag_1, revenue_current * 0.98)
                else:
                    revenue_lag_1q = safe_revenue(q_lag_2, revenue_current * 0.96) * 1.02 # Estimate

                revenue_lag_2q = safe_revenue(q_lag_2, revenue_lag_1q * 0.98)
                revenue_lag_4q = safe_revenue(q_lag_4, revenue_current * 0.92)

                # Revenue growth calculations
                revenue_growth_yoy = (revenue_current - revenue_lag_4q) / revenue_lag_4q if revenue_lag_4q > 0 else 0.05
                revenue_growth_qoq = (revenue_current - revenue_lag_1q) / revenue_lag_1q if revenue_lag_1q > 0 else 0.02"""

if old_chunk in t:
    t = t.replace(old_chunk, new_chunk)
    p.write_text(t, encoding='utf-8')
    print("SUCCESS")
else:
    print("NOT FOUND")
