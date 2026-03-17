import { NextRequest, NextResponse } from 'next/server';

// game score submission types
interface TapTheBeedoSubmission {
  game: 'tap-the-beedo';
  score: number;
  coinsEarned: number;
}

interface SlotsSubmission {
  game: 'slots';
  newBalance: number;
}

interface SpellingMeeSubmission {
  game: 'spelling-mee';
  wordsCompleted: number;
  coinsEarned: number;
}

interface MeedoMemorySubmission {
  game: 'meedo-memory';
  matchesFound: number;
  timeElapsed: number;
  coinsEarned: number;
}

type GameSubmission =
  | TapTheBeedoSubmission
  | SlotsSubmission
  | SpellingMeeSubmission
  | MeedoMemorySubmission;

// calculate coins based on game performance
function calculateCoins(submission: GameSubmission): number {
  switch (submission.game) {
    case 'tap-the-beedo':
      // already calculated on client, but we verify here
      const score = submission.score;
      if (score >= 30) return 50;
      if (score >= 20) return 30;
      if (score >= 10) return 15;
      if (score >= 5) return 5;
      return 2;

    case 'slots':
      // slots balance changes are handled differently - direct balance updates
      return 0;

    case 'spelling-mee':
      // coins per word completed with difficulty bonus
      return submission.wordsCompleted * 3;

    case 'meedo-memory':
      // base coins + time bonus
      const baseCoins = submission.matchesFound * 2;
      const timeBonus = Math.max(0, Math.floor((120 - submission.timeElapsed) / 10));
      return baseCoins + timeBonus;

    default:
      return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as GameSubmission;

    // validate required fields based on game type
    if (!body.game) {
      return NextResponse.json(
        { error: 'Game type is required' },
        { status: 400 }
      );
    }

    // todo: get user from session/auth
    // const user = await getUser(request);

    // todo: fetch current balance from database
    // const currentBalance = await getUserBalance(user.id);

    let coinsToAdd = 0;
    // let newBalance = 0;

    switch (body.game) {
      case 'tap-the-beedo':
        coinsToAdd = calculateCoins(body);
        // verify client-side calculation matches server
        if (coinsToAdd !== body.coinsEarned) {
          console.warn(`Coin mismatch for tap-the-beedo: client=${body.coinsEarned}, server=${coinsToAdd}`);
        }
        break;

      case 'slots':
        // for slots, we receive the new balance directly
        // todo: validate balance change is reasonable (no cheating)
        // newBalance = body.newBalance;
        break;

      case 'spelling-mee':
        coinsToAdd = calculateCoins(body);
        break;

      case 'meedo-memory':
        coinsToAdd = calculateCoins(body);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid game type' },
          { status: 400 }
        );
    }

    // todo: update user balance in database
    // if (body.game === 'slots') {
    //   await setUserBalance(user.id, newBalance);
    // } else {
    //   await addUserCoins(user.id, coinsToAdd);
    //   newBalance = currentBalance + coinsToAdd;
    // }

    // todo: save game result for leaderboards/history
    // await saveGameResult({
    //   userId: user.id,
    //   game: body.game,
    //   score: body.game === 'tap-the-beedo' ? body.score : undefined,
    //   coinsEarned: coinsToAdd,
    //   timestamp: new Date(),
    // });

    // todo: check for achievements/badges
    // await checkAchievements(user.id, body.game);

    // for now, just return success with mock data
    return NextResponse.json({
      success: true,
      coinsEarned: coinsToAdd,
      newBalance: body.game === 'slots' ? body.newBalance : 100 + coinsToAdd, // mock
      message: coinsToAdd > 0 ? `earned ${coinsToAdd} meedo coins!` : 'good game!',
    });
  } catch (error) {
    console.error('Error submitting game score:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}

// get current coin balance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // todo: get user from session/auth
    // const user = await getUser(request);

    // todo: fetch balance from database
    // const balance = await getUserBalance(user.id);

    // mock response for now
    return NextResponse.json({
      success: true,
      balance: 100,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
