import os
import asyncio
import subprocess

async def run_local_ml_processing():
    print("🚀 Running ML Batch Processing against LOCAL MongoDB...")
    
    # Environment variables for local run
    env = os.environ.copy()
    env["MONGO_URL"] = "mongodb://localhost:27017"
    env["DB_NAME"] = "ContractAI"
    
    # Run the existing script with local environment
    process = subprocess.Popen(
        ["python", "batch_process_ml.py"],
        env=env,
        cwd=os.getcwd()
    )
    
    print(f"Started local processing (PID: {process.pid})")
    return process

if __name__ == "__main__":
    p = asyncio.run(run_local_ml_processing())
    p.wait()
    print("✨ Local ML Processing finished.")
