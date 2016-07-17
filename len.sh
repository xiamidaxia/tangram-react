#!/usr/bin/env bash
wc -l `find $* | grep ".*\.\(less\|jsx\|less\|html\|js\|css\)"`
