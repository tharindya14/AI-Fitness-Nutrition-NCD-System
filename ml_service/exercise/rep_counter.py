import time


class BasicRepCounter:
    def __init__(self, up_threshold, down_threshold, mode="lower_is_down"):
        self.stage = "up"
        self.rep_count = 0
        self.up_threshold = up_threshold
        self.down_threshold = down_threshold
        self.mode = mode

    def update(self, value):
        previous_rep_count = self.rep_count

        if self.mode == "lower_is_down":
            # Example: squat, push-up, bicep curl, lunge, sit-up
            if value < self.down_threshold and self.stage == "up":
                self.stage = "down"

            if value > self.up_threshold and self.stage == "down":
                self.stage = "up"
                self.rep_count += 1

        elif self.mode == "higher_is_down":
            # Example: jumping jack
            if value > self.down_threshold and self.stage == "up":
                self.stage = "down"

            if value < self.up_threshold and self.stage == "down":
                self.stage = "up"
                self.rep_count += 1

        return {
            "rep_count": self.rep_count,
            "stage": self.stage,
            "rep_completed": self.rep_count > previous_rep_count
        }

    def reset(self):
        self.stage = "up"
        self.rep_count = 0


class PlankTimer:
    def __init__(self):
        self.start_time = None
        self.hold_seconds = 0
        self.incorrect_tolerance_frames = 0
        self.max_tolerance_frames = 15

    def update(self, status):
        if status == "Correct":
            self.incorrect_tolerance_frames = 0

            if self.start_time is None:
                self.start_time = time.time()

            self.hold_seconds = int(time.time() - self.start_time)

        else:
            self.incorrect_tolerance_frames += 1

            if self.incorrect_tolerance_frames > self.max_tolerance_frames:
                self.start_time = None
                self.hold_seconds = 0

        return {
            "rep_count": 0,
            "stage": "hold",
            "hold_seconds": self.hold_seconds,
            "rep_completed": False
        }


def create_counter(exercise_name):
    exercise_name = exercise_name.lower()

    if exercise_name == "squat":
        return BasicRepCounter(
            up_threshold=155,
            down_threshold=95,
            mode="lower_is_down"
        )

    if exercise_name == "pushup":
        return BasicRepCounter(
            up_threshold=150,
            down_threshold=115,
            mode="lower_is_down"
        )

    if exercise_name == "bicep_curl":
        return BasicRepCounter(
            up_threshold=145,
            down_threshold=85,
            mode="lower_is_down"
        )

    if exercise_name == "lunge":
        return BasicRepCounter(
            up_threshold=150,
            down_threshold=110,
            mode="lower_is_down"
        )

    if exercise_name == "plank":
        return PlankTimer()

    if exercise_name == "jumping_jack":
        # closed legs -> open legs -> closed legs = 1 rep
        return BasicRepCounter(
            up_threshold=1.35,      # closed position
            down_threshold=1.75,    # open position
            mode="higher_is_down"
        )

    if exercise_name == "situp":
        # lying down -> body up -> lying down = 1 rep
        return BasicRepCounter(
            up_threshold=135,
            down_threshold=95,
            mode="lower_is_down"
        )

    return BasicRepCounter(
        up_threshold=160,
        down_threshold=100,
        mode="lower_is_down"
    )