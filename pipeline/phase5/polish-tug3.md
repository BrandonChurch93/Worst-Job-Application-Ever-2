# Polish, the tug, round 3: the arrow at a strain of the paper

Branch `agent/polish-tug3` from `origin/main` at `eae5eba6`. Every number is labelled MEASURED (read from the stepped stage or from drawn frames in this work), STATED (taken from the Builder or from the code) or UNKNOWN.

## What was asked

The round 25 motion pack shows the arrow turning after its arrival at the paper (the pack's step 1912, STATED). Measure first, then mend where it is made. Ruling of 11:52 UTC: live only, the film byte equal; the strain's event and its time stay; at a strain the cause comes first in view and the arrow answers from the next step, a lean back from the slot over 6 to 10 steps, at most 4 degrees a step, back at least as slowly; the tip within 2 px; the answer still felt under a hand, its size following the strain if cheap; the haul and the stop at the arrival stay.

## Cause (MEASURED and read)

`src/pages/step1/index.ts`, live tug: on the step of a `paper-strain` the page called `io.cursor.react('flinch')`. The flinch (`src/cursor/act/feel.ts`) asks the body for stretch -0.34, lean -0.42 rad, turn -0.2 rad, bend -0.3 for 0.3 s, and the body's springs chase it. The first strain falls one step after the arrival, so the arrow turned at once. Live only: the film has no take and no flinch.

Before, under the pack's visitor (branch `agent/pack-frames`, strains at steps 1913, 1967, 2021, 2076, 2130, 2184, 2238, 2293, 2347, all MEASURED): the first flinch took lean + spin from -0.7 degrees (1912) to -37.4 (1922), at most 6.55 degrees in a step (1915); each later one from about -6 to about -36.7 in 9 to 10 steps, at most 5.4 in a step; the length fell from 1.22 to 0.85 and the bend from 0.63 to 0.19.

## The mend

Which of the two for the first strain: **(a)**. The event `paper-strain`, its sound and its step are unchanged at every strain (the test pins all nine and the grab and the loss); only the arrow's answer is changed.

1. `src/cursor/body.ts`, the arms only: a method `heave(lean)` beside `setArms`. What holds the arms asks the body for that much more lean, in radians, while the arms are out; the lean's own spring (k 330, c 17, STATED) takes it there and back. `setArms(false)` clears it. The film never calls it.
2. `src/pages/step1/index.ts`, the live tug: the flinch at a strain is gone. In its place, by the named numbers of `HEAVE`:
   - on the answer's first step the two hands on the paper are jerked toward the slot (6 px times the size, so 3.2 to 5.8 px MEASURED), so the arms tighten in view; the hands come back over the next 3 steps;
   - from the next step the body is asked to lean back from the slot: the asking rises to 0.44 rad times the size over 0.05 s and is let go over 0.3 s. The spring makes of it a lean that is seen from the second step after the jerk, is lowest 10 to 11 steps after the jerk, is back at its hold 22 steps after it, passes it by 1.8 degrees and is settled by 36 (MEASURED at the pack's strain 1967);
   - no answer begins sooner than 0.615 s after the hands close. Only the first strain falls inside that: its event sounds on its own step, the arrow is left 12 steps after the arrival, the hands are jerked on the pack's step 1924 and the lean is seen from 1926;
   - the size follows the strain: half of the whole at the tug's start, growing with the tug's age over 9 s or with the paper eaten, whichever is further on, so the nine answers are not nine copies (depth 11.4 to 17.5 degrees for the first eight, MEASURED);
   - the answer ends when the loss begins.
3. The bend and the length are not asked for anything by the answer any more.

What was not done, said plainly: the paper itself does not jerk at a strain, only the hands on it slide toward the slot by 3 to 6 px. The arms keep their 15 percent of slack (STATED), so the tightening shows as the hands going away from the body, not as a straight hose. In the 12 steps after the arrival the arrow is not wholly still: the swing of the stop at the arrival, which the ruling keeps, takes lean + spin from -0.7 degrees (1912) to -7.5 (1920) and back to -6.7 (1924), at most 1.83 degrees in a step (MEASURED). That motion was there before and is unchanged.

Rule 6: the flinch at a strain is from commit `734916f1`, older than `9fd4225b`; no test names it; the mend undoes no change made for a critic's issue that I could find (STATED from reading the history).

## Tables (MEASURED on the stepped stage, the pack's visitor, steps as in the pack)

Lean + spin in degrees (negative is the tip to the left, back from the slot); bend is the tail's lag (0.85 rad of turn at 1); length is the drawn length; the tip in page px. The last column but one is how far the tip after is from the tip before on the same step.

### The first strain (event on step 1913, arrival 1912)

| step | lean + spin before | after | turn in the step before | after | bend before | after | length before | after | tip after x, y | tip before to after, px | hands after |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1910 | 3.4 | 3.4 | -1.80 | -1.80 | 0.64 | 0.64 | 1.26 | 1.26 | 744.2, 504.4 | 0.00 | 751,611 810,592 |
| 1911 | 1.3 | 1.3 | -2.04 | -2.04 | 0.60 | 0.60 | 1.25 | 1.25 | 743.6, 504.4 | 0.00 | 750,611 809,592 |
| 1912 | -0.7 | -0.7 | -2.03 | -2.03 | 0.56 | 0.56 | 1.24 | 1.24 | 743.6, 504.5 | 0.00 | 750,611 809,591 |
| 1913 strain | -4.2 | -2.5 | -3.50 | -1.83 | 0.53 | 0.53 | 1.18 | 1.22 | 743.7, 504.3 | 0.00 | 750,611 809,591 |
| 1914 | -10.2 | -4.1 | -6.01 | -1.58 | 0.48 | 0.52 | 1.09 | 1.21 | 743.7, 504.0 | 0.00 | 750,611 809,591 |
| 1915 | -16.8 | -5.4 | -6.55 | -1.28 | 0.44 | 0.51 | 0.99 | 1.21 | 743.3, 503.5 | 0.00 | 750,610 809,591 |
| 1916 | -22.7 | -6.4 | -5.96 | -0.99 | 0.39 | 0.51 | 0.92 | 1.20 | 743.2, 503.2 | 0.00 | 750,610 809,591 |
| 1917 | -27.5 | -7.0 | -4.82 | -0.64 | 0.34 | 0.51 | 0.87 | 1.20 | 743.6, 503.4 | 0.00 | 750,610 809,591 |
| 1918 | -31.1 | -7.3 | -3.62 | -0.34 | 0.31 | 0.52 | 0.85 | 1.20 | 743.5, 503.7 | 0.00 | 750,610 809,591 |
| 1919 | -33.8 | -7.5 | -2.60 | -0.16 | 0.28 | 0.53 | 0.84 | 1.20 | 743.1, 503.6 | 0.00 | 750,610 809,591 |
| 1920 | -35.5 | -7.5 | -1.79 | -0.03 | 0.25 | 0.55 | 0.84 | 1.21 | 742.6, 503.6 | 0.00 | 750,610 808,590 |
| 1921 | -36.7 | -7.5 | -1.17 | 0.06 | 0.24 | 0.56 | 0.85 | 1.21 | 742.4, 503.3 | 0.00 | 749,610 808,590 |
| 1922 | -37.4 | -7.3 | -0.68 | 0.16 | 0.23 | 0.58 | 0.86 | 1.21 | 742.5, 503.0 | 0.00 | 749,610 808,590 |
| 1923 | -36.6 | -7.1 | 0.75 | 0.26 | 0.23 | 0.59 | 0.89 | 1.21 | 742.8, 502.8 | 0.00 | 750,610 808,590 |
| 1924 | -34.0 | -6.7 | 2.62 | 0.34 | 0.26 | 0.60 | 0.93 | 1.21 | 743.3, 502.6 | 0.00 | 751,613 810,593 |
| 1925 | -30.8 | -6.5 | 3.21 | 0.25 | 0.30 | 0.60 | 0.98 | 1.21 | 743.6, 502.3 | 0.00 | 751,611 810,592 |
| 1926 | -27.5 | -6.8 | 3.30 | -0.30 | 0.36 | 0.61 | 1.03 | 1.21 | 743.6, 502.2 | 0.00 | 750,609 809,590 |
| 1927 | -24.3 | -7.9 | 3.17 | -1.15 | 0.42 | 0.61 | 1.07 | 1.21 | 743.7, 502.5 | 0.00 | 750,609 809,590 |
| 1928 | -21.4 | -9.7 | 2.91 | -1.76 | 0.48 | 0.61 | 1.10 | 1.21 | 743.6, 502.5 | 0.00 | 750,609 809,589 |
| 1929 | -18.9 | -11.7 | 2.51 | -2.05 | 0.53 | 0.61 | 1.11 | 1.21 | 743.0, 502.6 | 0.00 | 750,609 808,589 |
| 1930 | -16.9 | -13.8 | 2.01 | -2.03 | 0.58 | 0.61 | 1.12 | 1.21 | 742.6, 502.5 | 0.00 | 749,609 808,589 |
| 1931 | -15.1 | -15.5 | 1.80 | -1.76 | 0.62 | 0.61 | 1.13 | 1.21 | 742.7, 502.7 | 0.00 | 749,609 808,589 |
| 1932 | -13.1 | -16.8 | 2.05 | -1.31 | 0.64 | 0.60 | 1.15 | 1.21 | 743.1, 502.8 | 0.00 | 749,608 808,589 |
| 1933 | -10.9 | -17.7 | 2.13 | -0.85 | 0.66 | 0.60 | 1.17 | 1.21 | 743.0, 502.6 | 0.00 | 749,608 808,589 |
| 1934 | -8.9 | -18.1 | 2.00 | -0.43 | 0.67 | 0.59 | 1.19 | 1.21 | 742.8, 502.6 | 0.00 | 749,608 808,589 |
| 1935 | -7.2 | -18.1 | 1.75 | -0.01 | 0.67 | 0.58 | 1.20 | 1.21 | 742.9, 502.1 | 0.00 | 749,608 808,589 |
| 1936 | -5.7 | -17.7 | 1.44 | 0.38 | 0.67 | 0.58 | 1.21 | 1.21 | 742.9, 501.5 | 0.00 | 749,608 808,588 |
| 1937 | -4.7 | -17.0 | 1.08 | 0.73 | 0.66 | 0.58 | 1.22 | 1.21 | 742.9, 501.2 | 0.00 | 749,608 808,588 |
| 1938 | -3.9 | -16.0 | 0.74 | 1.04 | 0.64 | 0.57 | 1.22 | 1.21 | 743.2, 501.2 | 0.00 | 749,607 808,588 |
| 1939 | -3.5 | -14.7 | 0.44 | 1.32 | 0.63 | 0.57 | 1.22 | 1.21 | 743.4, 501.1 | 0.00 | 749,607 808,588 |
| 1940 | -3.3 | -13.1 | 0.18 | 1.52 | 0.61 | 0.57 | 1.22 | 1.21 | 743.6, 501.3 | 0.00 | 749,607 808,588 |
| 1941 | -3.3 | -11.5 | -0.02 | 1.63 | 0.60 | 0.57 | 1.22 | 1.21 | 743.8, 501.4 | 0.00 | 749,607 809,588 |
| 1942 | -3.5 | -9.9 | -0.20 | 1.62 | 0.59 | 0.57 | 1.22 | 1.21 | 743.5, 501.3 | 0.00 | 749,607 808,588 |
| 1943 | -3.9 | -8.4 | -0.39 | 1.47 | 0.58 | 0.57 | 1.21 | 1.21 | 742.9, 500.9 | 0.00 | 749,607 808,588 |
| 1944 | -4.4 | -7.1 | -0.45 | 1.30 | 0.57 | 0.57 | 1.21 | 1.21 | 742.9, 500.4 | 0.00 | 749,607 808,587 |
| 1945 | -4.8 | -6.0 | -0.43 | 1.10 | 0.56 | 0.57 | 1.21 | 1.21 | 742.9, 500.3 | 0.00 | 749,607 808,587 |
| 1946 | -5.2 | -5.2 | -0.42 | 0.84 | 0.56 | 0.58 | 1.21 | 1.21 | 742.5, 500.3 | 0.00 | 749,606 808,587 |
| 1947 | -5.6 | -4.6 | -0.39 | 0.55 | 0.56 | 0.58 | 1.21 | 1.21 | 742.3, 500.6 | 0.00 | 749,606 808,587 |
| 1948 | -5.9 | -4.3 | -0.30 | 0.31 | 0.56 | 0.58 | 1.21 | 1.21 | 742.5, 500.8 | 0.00 | 749,606 808,587 |
| 1949 | -6.1 | -4.2 | -0.20 | 0.13 | 0.56 | 0.58 | 1.21 | 1.21 | 742.6, 501.0 | 0.00 | 749,606 808,587 |
| 1950 | -6.2 | -4.2 | -0.14 | -0.05 | 0.56 | 0.58 | 1.21 | 1.21 | 742.4, 500.8 | 0.00 | 749,606 808,587 |

### A later strain (event on step 1967)

| step | lean + spin before | after | turn in the step before | after | bend before | after | length before | after | tip after x, y | tip before to after, px | hands after |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1965 | -5.9 | -6.2 | 0.10 | 0.16 | 0.54 | 0.54 | 1.21 | 1.21 | 741.3, 497.0 | 0.00 | 748,605 807,586 |
| 1966 | -5.8 | -6.0 | 0.10 | 0.16 | 0.54 | 0.54 | 1.21 | 1.21 | 741.1, 496.5 | 0.00 | 748,605 807,586 |
| 1967 strain | -6.7 | -5.9 | -0.83 | 0.11 | 0.54 | 0.54 | 1.18 | 1.21 | 740.8, 495.7 | 0.00 | 750,609 808,589 |
| 1968 | -10.6 | -5.9 | -3.93 | -0.06 | 0.51 | 0.54 | 1.11 | 1.21 | 740.5, 495.6 | 0.00 | 749,608 808,588 |
| 1969 | -15.8 | -6.6 | -5.21 | -0.65 | 0.48 | 0.54 | 1.02 | 1.21 | 740.5, 495.8 | 0.00 | 748,606 807,587 |
| 1970 | -21.0 | -8.0 | -5.24 | -1.43 | 0.43 | 0.54 | 0.95 | 1.21 | 740.5, 495.9 | 0.00 | 748,606 807,586 |
| 1971 | -25.7 | -10.0 | -4.63 | -1.95 | 0.38 | 0.54 | 0.90 | 1.21 | 740.8, 495.8 | 0.00 | 748,605 807,586 |
| 1972 | -29.4 | -12.1 | -3.72 | -2.09 | 0.34 | 0.54 | 0.86 | 1.21 | 741.0, 495.6 | 0.00 | 749,605 807,586 |
| 1973 | -32.2 | -14.0 | -2.81 | -1.97 | 0.29 | 0.54 | 0.85 | 1.21 | 741.0, 495.9 | 0.00 | 749,605 807,586 |
| 1974 | -34.2 | -15.7 | -2.03 | -1.65 | 0.25 | 0.54 | 0.85 | 1.21 | 741.1, 496.0 | 0.00 | 749,605 807,586 |
| 1975 | -35.6 | -16.9 | -1.38 | -1.24 | 0.22 | 0.54 | 0.85 | 1.21 | 740.9, 495.6 | 0.00 | 749,605 807,586 |
| 1976 | -36.5 | -17.8 | -0.92 | -0.84 | 0.20 | 0.55 | 0.86 | 1.21 | 740.5, 495.7 | 0.00 | 748,606 807,586 |
| 1977 | -36.5 | -18.2 | 0.05 | -0.41 | 0.19 | 0.55 | 0.88 | 1.21 | 740.5, 495.7 | 0.00 | 748,606 807,586 |
| 1978 | -34.3 | -18.1 | 2.20 | 0.05 | 0.20 | 0.55 | 0.92 | 1.21 | 741.1, 495.4 | 0.00 | 749,605 807,586 |
| 1979 | -31.3 | -17.7 | 3.01 | 0.45 | 0.23 | 0.55 | 0.97 | 1.21 | 741.1, 495.4 | 0.00 | 749,605 808,586 |
| 1980 | -28.1 | -16.9 | 3.15 | 0.76 | 0.28 | 0.55 | 1.02 | 1.21 | 740.9, 495.9 | 0.00 | 748,605 807,586 |
| 1981 | -25.1 | -15.9 | 3.04 | 1.05 | 0.34 | 0.55 | 1.06 | 1.21 | 741.0, 496.5 | 0.00 | 748,605 807,586 |
| 1982 | -22.3 | -14.6 | 2.82 | 1.28 | 0.39 | 0.55 | 1.09 | 1.21 | 741.0, 496.4 | 0.00 | 748,605 807,586 |
| 1983 | -19.8 | -13.1 | 2.49 | 1.44 | 0.45 | 0.55 | 1.11 | 1.21 | 740.9, 495.7 | 0.00 | 748,605 807,586 |
| 1984 | -17.7 | -11.6 | 2.09 | 1.51 | 0.50 | 0.55 | 1.12 | 1.21 | 740.7, 495.4 | 0.00 | 748,605 807,586 |
| 1985 | -15.9 | -10.2 | 1.76 | 1.48 | 0.55 | 0.55 | 1.13 | 1.21 | 740.3, 495.7 | 0.00 | 748,606 807,586 |
| 1986 | -13.9 | -8.8 | 1.98 | 1.40 | 0.58 | 0.55 | 1.14 | 1.21 | 740.2, 495.8 | 0.00 | 748,606 807,586 |
| 1987 | -11.8 | -7.5 | 2.11 | 1.27 | 0.61 | 0.55 | 1.16 | 1.21 | 740.3, 495.8 | 0.00 | 748,606 807,586 |
| 1988 | -9.8 | -6.4 | 2.07 | 1.09 | 0.62 | 0.55 | 1.18 | 1.21 | 740.3, 495.9 | 0.00 | 748,606 807,586 |
| 1989 | -7.9 | -5.5 | 1.87 | 0.86 | 0.63 | 0.55 | 1.20 | 1.21 | 740.2, 495.9 | 0.00 | 748,606 807,586 |
| 1990 | -6.3 | -4.9 | 1.57 | 0.61 | 0.63 | 0.55 | 1.21 | 1.21 | 740.2, 495.6 | 0.00 | 748,606 807,586 |
| 1991 | -5.1 | -4.5 | 1.23 | 0.40 | 0.63 | 0.55 | 1.22 | 1.21 | 740.6, 495.2 | 0.00 | 748,606 807,586 |
| 1992 | -4.2 | -4.3 | 0.93 | 0.26 | 0.62 | 0.55 | 1.22 | 1.21 | 741.2, 495.4 | 0.00 | 749,605 808,586 |
| 1993 | -3.5 | -4.1 | 0.62 | 0.14 | 0.61 | 0.55 | 1.22 | 1.21 | 741.3, 495.6 | 0.00 | 749,605 808,586 |
| 1994 | -3.2 | -4.2 | 0.29 | -0.03 | 0.59 | 0.55 | 1.22 | 1.21 | 741.3, 495.6 | 0.00 | 749,605 808,586 |
| 1995 | -3.2 | -4.3 | 0.04 | -0.12 | 0.58 | 0.55 | 1.22 | 1.21 | 741.5, 495.4 | 0.00 | 749,605 808,586 |
| 1996 | -3.4 | -4.5 | -0.17 | -0.20 | 0.57 | 0.55 | 1.22 | 1.21 | 741.2, 495.6 | 0.00 | 749,605 808,586 |
| 1997 | -3.7 | -4.8 | -0.36 | -0.29 | 0.56 | 0.55 | 1.21 | 1.21 | 740.9, 495.9 | 0.00 | 748,605 807,586 |
| 1998 | -4.2 | -5.1 | -0.46 | -0.31 | 0.54 | 0.55 | 1.21 | 1.21 | 740.7, 496.1 | 0.00 | 748,605 807,586 |
| 1999 | -4.7 | -5.4 | -0.46 | -0.29 | 0.53 | 0.55 | 1.21 | 1.21 | 741.0, 496.4 | 0.00 | 748,605 807,586 |
| 2000 | -5.0 | -5.6 | -0.39 | -0.20 | 0.53 | 0.54 | 1.21 | 1.21 | 741.4, 496.6 | 0.00 | 749,605 807,586 |

### All nine strains, after

| strain's step | paper eaten | lean + spin before the answer | lowest | steps from the jerk to the lowest | most turn in one step |
|---|---|---|---|---|---|
| 1913 (jerk on 1924) | 0.093 | -6.7 | -18.1 | 11 | 2.05 |
| 1967 | 0.030 | -6.0 | -18.2 | 10 | 2.09 |
| 2021 | 0.030 | -6.0 | -18.8 | 11 | 2.27 |
| 2076 | 0.030 | -6.1 | -19.7 | 10 | 2.23 |
| 2130 | 0.030 | -5.8 | -21.0 | 10 | 2.60 |
| 2184 | 0.030 | -6.0 | -21.6 | 10 | 2.71 |
| 2238 | 0.053 | -5.7 | -22.2 | 11 | 2.86 |
| 2293 | 0.225 | -5.6 | -23.1 | 10 | 2.98 |
| 2347 | 0.558 | -5.5 | -25.9, then the scared lean of the tug's end takes it to -29.0, as before | 14 | 3.31 |

From the grab (1883) until the tug is lost (2400) the only steps with more than 4 degrees of turn are the haul, 1892 to 1895 (-4.21, -7.43, -8.80, -7.39), and the stop at the arrival, 1903 and 1904 (9.14, 6.71). They are as before. Under main's own visitor (the grab on 1823) they are 1832 to 1836 (-4.14, -7.29, -8.70, -7.39, -4.14) and 1843, 1844 (9.40, 7.37); under the keen bot (the grab on 1220) 1234 to 1237 (-4.75, -5.36, -5.24, -4.30). The test names them as frames counted from the grab.

The tip: on every step from the grab to the loss the tip after is 0.00 px from the tip before. The answer moves no tip; the tip's own travel in those steps is the visitor's hand.

The bend and the length through an answer with little paper eaten: at most 0.003 and 0.001 in a step (before: 0.060 and 0.084).

## The film (MEASURED)

- Stepped model: all 1920 film frames of step 1 (film 841 to 2760), hash of the draw list and of the arrow's pose on each: equal before and after, and the 351 events equal (`pipeline/phase5/polish-tug-filmdiff.ts.txt`, run before and after, `cmp`).
- The test pins the hash of the film's arrow poses and events from its grab (film 2162) for 271 frames, taken before the mend: `ed347022bc83`, the same after.
- Three draft stills, hd, before and after by `cmp`: `step1-fire` byte equal, `step1-tug` byte equal, `marketing-top` byte equal.
- Not done: `cmp` of drawn draft frames over film 2162 to 2440. The equal states above stand in for it, as the ruling allows.
- No other page's code is touched; `src/cursor/body.ts` changes only where `heave` is set, and nothing but the live tug of step 1 sets it.

## Pictures (looked at, at real size)

`out/work/polish-tug3/first-strain.png` and `later-strain.png`: 27 frames in a row, each 1/60 s, real size, page x 718 to 838, y 494 to 636 (a cut of the pack's window so that the picture stays under 1.1 megapixels), before above, after below, the frame and its time under each, the strain's frame (and the jerk's frame 1924) in yellow. Drawn from the live site at hd under the pack's visitor by `pipeline/phase5/polish-tug3-shots.mjs` and laid out by `pipeline/phase5/polish-tug3-pair.mjs`.

What I saw:

- First strain, before: from 1914 the arrow swings round fast and shortens, the tail thrown to the right, most on 1921 to 1923, and it is still coming back on 1938.
- First strain, after: 1912 to 1924 the arrow stands nearly as it arrived, with a small slow settling of its lean; from 1926 it leans back by degrees, lowest about 1935, a much smaller lean than before, the length unchanged, the tip in one place. On 1938 it is on its way back.
- Later strain, before: the same fast swing from 1968, most on 1975 to 1977.
- Later strain, after: 1966 to 1968 the arrow stands; it leans back from 1969, lowest about 1977 to 1979, and is nearly upright again by 1990.
- The jerk of the hands: at real size it is a hop of 3 to 4 px and I could not be sure of it by eye in the sheet. Blown up twice (for looking only, not sent as proof) the two hands and the word on the paper sit a few px nearer the slot on 1924 and 1925, and on 1967 and 1968, and are back two frames later.

## Tests

`tests/polish-tug3.test.ts`, stepped, no browser, the pack's visitor and the keen bot and the film's path:

- no event of the tug moved (the grab, nine strains, the loss, by step);
- from the grab until the tug is lost the drawn angle changes by at most 4 degrees in a frame, but on the named frames of the haul and the stop (at most 9.5), and by at most 4 in each of the 40 frames after the arrival;
- after the first strain the arrow is left 11 frames (at most 2 degrees of settling in one), the hands still; then, and at every later strain on its own frame, the hands go at least 2 px toward the slot while the angle moves at most 0.5; the lean is 8 to 24 degrees deep, lowest 6 to 12 frames after the jerk, back within 3 degrees by 40; bend and length change by at most 0.01 and 0.005 a frame; the seventh answer is at least 2 degrees deeper than the second;
- the film: at most 9.5 degrees in a frame from its grab for 271 frames (MEASURED most 9.0), five strains, and the pinned hash.

On main before the mend 5 of its 6 tests fail (the live ones and, with no pin yet, the film's); after, 6 pass.

`tests/polish-tug3-measure.test.ts` writes the tables and is skipped unless `POLISH_TUG3_TABLE` is set. `tests/polish-tug3-run.ts` steps the film's path.

## Checks before the push (27 November 2026, UTC, one at a time)

- `npm run determinism`: pass, 12 pictures at hd, tier draft, identical across two fresh loads and two orders (ended 12:20).
- `npm run bots`: all clear, keen reached every one of the 37 gags on every seed (12:20).
- whole `npm test`: 166 files passed, 11 skipped; 2086 tests passed, 14 skipped (ended 12:24). No test of another owner was changed.
- `npx tsc --noEmit -p .`: clean, last of all (12:25).

## Left open

- The paper does not jerk at a strain, only the hands on it; the hop is 3 to 6 px for three frames and is small at real size.
- The swing of the stop at the arrival still moves the lean by 6.8 degrees in the 8 steps after the arrival (at most 1.83 a step); the ruling keeps the stop as it is.
- No `cmp` of drawn draft film frames over 2162 to 2440 was made; the stepped model's equal states and the three equal stills stand for the film.
