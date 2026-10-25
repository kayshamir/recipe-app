import { Body, Card, Screen } from '@/components/foundation';
export default function Discover() {
  return (
    <Screen title="Explore Philippine food" topInset>
      <Body>Discover dishes, find recipes, and make something delicious.</Body>
      <Card>
        <Body>
          The recipe collection is being prepared. Browse, search, regional discovery, and
          ingredient matching will appear here.
        </Body>
      </Card>
      <Body>You can explore recipes without an account when the collection is available.</Body>
    </Screen>
  );
}
