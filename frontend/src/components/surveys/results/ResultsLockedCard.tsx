import { Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Sondage publié : résultats et analyse IA seulement après la clôture
export function ResultsLockedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock aria-hidden="true" className="size-4" /> Résultats et analyse IA
        </CardTitle>
        <CardDescription>Disponibles après la clôture du sondage.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Les résultats ne sont pas affichés pendant que le sondage est ouvert : en les comparant avant et après une
          nouvelle réponse, on pourrait deviner ce qu’une personne a répondu. Suivez la participation en attendant.
        </p>
      </CardContent>
    </Card>
  );
}