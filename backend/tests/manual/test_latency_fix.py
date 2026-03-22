"""
Demonstrate the latency tracking fix
"""

import asyncio
import time

print("\n" + "="*80)
print("DEMONSTRATING LATENCY TRACKING FIX")
print("="*80 + "\n")

# Simulate agents with different execution times
async def agent_fast():
    await asyncio.sleep(0.1)  # 100ms
    return "fast_result"

async def agent_medium():
    await asyncio.sleep(0.5)  # 500ms
    return "medium_result"

async def agent_slow():
    await asyncio.sleep(1.0)  # 1000ms
    return "slow_result"


# OLD CODE (BROKEN)
print("OLD CODE (BROKEN):")
print("-" * 40)

async def old_approach():
    start_time = time.time()
    
    agents = {
        "fast": agent_fast,
        "medium": agent_medium,
        "slow": agent_slow
    }
    
    # Execute all agents
    results = await asyncio.gather(*[agent() for agent in agents.values()])
    
    # Calculate total time
    total_time = int((time.time() - start_time) * 1000)
    
    # OLD BUG: Assign same time to all agents
    agent_latencies = {}
    for name in agents.keys():
        agent_latencies[name] = total_time
    
    return agent_latencies

old_latencies = asyncio.run(old_approach())

print("Agent latencies (OLD):")
for name, latency in old_latencies.items():
    print(f"  {name:10s}: {latency:5d}ms")

print(f"\n✗ BUG: All agents show same latency ({old_latencies['fast']}ms)")
print(f"  Reality: fast=100ms, medium=500ms, slow=1000ms")
print()


# NEW CODE (FIXED)
print("\n" + "="*80)
print("NEW CODE (FIXED):")
print("="*80 + "\n")

async def new_approach():
    async def run_agent_with_timing(name: str, agent_func):
        """Wrapper to time individual agent execution"""
        start = time.time()
        try:
            result = await asyncio.wait_for(agent_func(), timeout=30.0)
            latency = int((time.time() - start) * 1000)  # Convert to ms
            return name, result, latency, None
        except Exception as e:
            latency = int((time.time() - start) * 1000)
            return name, None, latency, e
    
    agents = {
        "fast": agent_fast,
        "medium": agent_medium,
        "slow": agent_slow
    }
    
    # Create tasks with individual timing
    agent_tasks = [
        run_agent_with_timing(name, agent)
        for name, agent in agents.items()
    ]
    
    results = await asyncio.gather(*agent_tasks, return_exceptions=True)
    
    agent_latencies = {}
    for result in results:
        if not isinstance(result, Exception):
            name, output, latency, error = result
            agent_latencies[name] = latency
    
    return agent_latencies

new_latencies = asyncio.run(new_approach())

print("Agent latencies (NEW):")
for name, latency in new_latencies.items():
    print(f"  {name:10s}: {latency:5d}ms")

print()
print("✓ FIXED: Each agent shows its actual execution time")
print(f"  fast:   ~{new_latencies['fast']}ms (expected ~100ms)")
print(f"  medium: ~{new_latencies['medium']}ms (expected ~500ms)")
print(f"  slow:   ~{new_latencies['slow']}ms (expected ~1000ms)")
print()

# Verify
unique_values = len(set(new_latencies.values()))
print("VERIFICATION:")
print("-" * 40)
print(f"  Unique latency values: {unique_values}")
print(f"  All different: {unique_values == len(new_latencies)}")
print(f"  Proper ordering: {new_latencies['fast'] < new_latencies['medium'] < new_latencies['slow']}")
print()

print("="*80)
print("EXPLANATION:")
print("="*80)
print("""
The old code timed the entire asyncio.gather() block and assigned that total
wall time to ALL agents. This meant:
- Fast agents appeared slow
- You couldn't identify performance bottlenecks
- Latency metrics were meaningless

The new code wraps each agent execution with individual timing:
1. Each agent gets its own start timestamp
2. Latency is calculated per agent: (end_time - start_time)
3. Results include (name, output, latency, error) tuple
4. Each agent's true execution time is captured

This allows proper performance monitoring and bottleneck identification.
""")
print("="*80 + "\n")
