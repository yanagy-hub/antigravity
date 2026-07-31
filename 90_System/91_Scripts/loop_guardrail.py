import argparse
import json
import os

STATE_FILE = "Antigravity_Doc/93_Temporary/loop_state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Loop Guardrail Checker")
    parser.add_argument("--task-id", required=True, help="Unique ID for the current loop task")
    parser.add_argument("--max-iterations", type=int, default=3, help="Maximum allowed iterations")
    parser.add_argument("--reset", action="store_true", help="Reset the iteration count for this task")
    args = parser.parse_args()

    state = load_state()
    task_id = args.task_id

    if args.reset:
        state[task_id] = {"iteration": 0}
        save_state(state)
        print(f"Task '{task_id}' iteration count has been reset.")
        return

    # Initialize or increment
    if task_id not in state:
        state[task_id] = {"iteration": 1}
    else:
        state[task_id]["iteration"] += 1

    current_iteration = state[task_id]["iteration"]
    save_state(state)

    print(f"[Loop Guardrail] Task: {task_id} | Iteration: {current_iteration} / {args.max_iterations}")

    if current_iteration > args.max_iterations:
        print(f"CRITICAL: Maximum iteration count ({args.max_iterations}) exceeded!")
        print("ACTION REQUIRED: Stop the loop immediately. Ask the user for help or change the approach.")
        exit(1)
    else:
        print("STATUS: OK to proceed.")
        exit(0)

if __name__ == "__main__":
    main()
