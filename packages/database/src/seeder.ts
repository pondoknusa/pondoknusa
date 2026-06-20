export abstract class Seeder {
  abstract run(): Promise<void>;

  async call(SeederClass: new () => Seeder): Promise<void> {
    await new SeederClass().run();
  }
}