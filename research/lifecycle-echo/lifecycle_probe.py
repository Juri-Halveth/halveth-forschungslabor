"""Four bounded local Python runs; no network or existing-file mutation."""
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import time
from datetime import datetime, timezone
from uuid import uuid4


def now():
    return datetime.now(timezone.utc).isoformat()


def write_new(path, value):
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


NORMAL = '''import pathlib, sys
pathlib.Path(sys.argv[1]).write_text("completed-result\\n", encoding="utf-8")
try:
    print("BEFORE_EXIT", flush=True)
    sys.exit(0)
finally:
    print("FINALLY", flush=True)
print("AFTER_EXIT", flush=True)
'''

CAUGHT = '''import sys
try:
    sys.exit(0)
except SystemExit as event:
    print("CAUGHT:" + str(event.code), flush=True)
print("AFTER_CAUGHT_EXIT", flush=True)
'''

THREAD = '''import sys, threading
def worker():
    print("THREAD_BEFORE_EXIT", flush=True)
    sys.exit(0)
    print("THREAD_AFTER_EXIT", flush=True)
thread = threading.Thread(target=worker)
thread.start()
thread.join(timeout=2)
if thread.is_alive():
    raise RuntimeError("worker failed to finish")
print("MAIN_AFTER_THREAD_EXIT", flush=True)
'''


def main():
    started = now()
    root = Path(__file__).resolve().parent / ("run-" + uuid4().hex)
    root.mkdir()
    scope = {
        "recordedAt": started,
        "target": "Four newly spawned isolated Python children only",
        "owner": "Local user; synthetic fixtures generated for this probe",
        "authorization_source": "Current request about software self-termination; reversible local demonstration",
        "network_active": False,
        "writes": str(root),
        "command": [sys.executable, "-I", "-S", "-c", "fixed literal source"],
        "stop": "Five seconds per child; terminate only this probe's own timed-out child",
        "hypotheses": [
            "Uncaught main-thread SystemExit(0) returns zero and executes finally, not subsequent code",
            "Caught SystemExit permits later code to run",
            "SystemExit in a worker thread permits the main thread to continue",
            "Identical source can create a new run with equal output without historical process identity",
        ],
        "observer": "Parent wait result, subsequently drained small stdout pipe, own fixture reads",
        "coverage": "Explicit program markers and post-exit artifacts only; no complete OS, memory or syscall trace",
        "clock": {"wall": "UTC system clock", "elapsed": "time.perf_counter_ns", "calibration": "NOT_MEASURED"},
        "loss": "No claim of zero system-event loss; only the listed small stdout messages are checked",
        "limitations": "Pipe retention is software buffering, not astronomical light propagation; no physical or biological experiment",
        "source_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    }
    write_new(root / "PLAN.json", scope)
    observations = []
    for name, source in [("normal", NORMAL), ("caught", CAUGHT), ("thread", THREAD), ("normal_new_instance", NORMAL)]:
        work = root / name
        work.mkdir()
        output = work / "result.txt"
        launch_at = now()
        tick = time.perf_counter_ns()
        child = subprocess.Popen(
            [sys.executable, "-I", "-S", "-c", source, str(output)],
            cwd=work, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        try:
            code = child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.kill()
            child.communicate(timeout=2)
            raise RuntimeError("Own child timed out; stopped without continuing")
        waited_at = now()
        stdout = child.stdout.read().decode("utf-8")
        stderr = child.stderr.read().decode("utf-8")
        child.stdout.close()
        child.stderr.close()
        observations.append({
            "id": name,
            "instance_id": uuid4().hex,
            "pid": child.pid,
            "source_sha256": hashlib.sha256(source.encode()).hexdigest(),
            "launchedAt": launch_at,
            "waitReturnedAt": waited_at,
            "pipeReadCompletedAt": now(),
            "duration_ns": time.perf_counter_ns() - tick,
            "exit_code": code,
            "stdout": stdout.splitlines(),
            "stderr": stderr,
            "file_exists_after_exit": output.is_file(),
            "file_sha256": hashlib.sha256(output.read_bytes()).hexdigest() if output.is_file() else None,
        })
    normal, caught, thread, successor = observations
    checks = {
        "all_exit_codes_zero": all(x["exit_code"] == 0 for x in observations),
        "all_stderr_empty": all(x["stderr"] == "" for x in observations),
        "finally_runs_subsequent_code_does_not": normal["stdout"] == ["BEFORE_EXIT", "FINALLY"],
        "exit_can_be_caught": caught["stdout"] == ["CAUGHT:0", "AFTER_CAUGHT_EXIT"],
        "thread_exit_does_not_end_main": thread["stdout"] == ["THREAD_BEFORE_EXIT", "MAIN_AFTER_THREAD_EXIT"],
        "file_survives_normal_exit": normal["file_exists_after_exit"],
        "same_source_new_run_equal_result": normal["source_sha256"] == successor["source_sha256"] and normal["file_sha256"] == successor["file_sha256"],
        "distinct_launch_records": normal["instance_id"] != successor["instance_id"],
    }
    result = {
        "startedAt": started,
        "observedAt": now(),
        "status": "FINITE_SNAPSHOT",
        "runtime": {"python": platform.python_version(), "implementation": platform.python_implementation(), "platform": sys.platform},
        "plan_sha256": hashlib.sha256((root / "PLAN.json").read_bytes()).hexdigest(),
        "observations": observations,
        "checks": checks,
        "claim_ceiling": "Four local launches; no memory sanitization, remote cancellation, full intermediate-state, astrophysical or biological proof",
        "reopen_trigger": "A concrete supervisor, queue or receiver contract to compare against these terminal observations",
    }
    write_new(root / "RESULTS.json", result)
    print(json.dumps({"result": str(root / "RESULTS.json"), "checks": checks, "observations": observations}, ensure_ascii=False, indent=2))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
