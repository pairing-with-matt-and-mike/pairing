.PHONY: bootstrap

bootstrap:
	python3 -m venv _virtualenv
	_virtualenv/bin/pip install --upgrade pip setuptools wheel
	_virtualenv/bin/pip install -r requirements.txt

test:
	ls *.py | entr -- _virtualenv/bin/py.test -v -x main2.py
