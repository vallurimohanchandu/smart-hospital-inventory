import os
import sys
import pytest

if __name__ == "__main__":
    os.environ["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"
    args = ["-v", "tests/test_all_requirements.py"] + sys.argv[1:]
    exit_code = pytest.main(args)
    sys.exit(exit_code)
