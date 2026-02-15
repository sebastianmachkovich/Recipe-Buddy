import { Check, PencilIcon, PlusIcon } from "lucide-react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";
import {
  recipesOnCounterAtom,
  IngredientUnit,
  type RecipeCardData,
} from "@/lib/state";
import { useAtom } from "jotai";
import { atom } from "jotai";

const recipes: RecipeCardData[] = [
  {
    id: 1,
    title: "Spaghetti Carbonara",
    description:
      "A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.",
    imgUrl:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
    ingredients: [
      { id: 1, name: "Eggs", amount: 2 },
      { id: 2, name: "Cheese", amount: 1, unit: IngredientUnit.oz },
    ],
  },
  {
    id: 2,
    title: "Chicken Tikka Masala",
    description:
      "Tender chicken in a creamy, spiced tomato sauce served with basmati rice.",
    imgUrl:
      "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 3,
    title: "Beef Tacos",
    description:
      "Seasoned ground beef in crispy corn tortillas with fresh toppings and salsa.",
    imgUrl:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 4,
    title: "Caesar Salad",
    description:
      "Crisp romaine lettuce with parmesan, croutons, and creamy Caesar dressing.",
    imgUrl:
      "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 5,
    title: "Margherita Pizza",
    description:
      "Traditional Neapolitan pizza with fresh mozzarella, tomatoes, and basil.",
    imgUrl:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 6,
    title: "Grilled Salmon",
    description:
      "Fresh Atlantic salmon fillet with lemon herb butter and steamed vegetables.",
    imgUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 7,
    title: "Mushroom Risotto",
    description:
      "Creamy Italian rice dish with mixed wild mushrooms and parmesan cheese. asldfj sad lsajfljsdf  lak  lkjsldflskd jflsl alk sld fkdsl jflkds jfls jlskd jfksld jflksjlsj flsjf oiwejfowlskdfmlkxjiod   jo welf sld jfsldk jwoie jlsdk jslk jiojfwiojdslkf jliweljfowijfldkj dlskjdiwejfldksd jkdsl jfoi",
    imgUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
    ingredients: [],
  },
  {
    id: 8,
    title: "BBQ Ribs",
    description:
      "Slow-cooked pork ribs with tangy barbecue sauce and coleslaw.",
    imgUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
    ingredients: [],
  },
];

function AddRecipeCard() {
  return (
    <EditRecipeDialogProvider>
      <Card className="h-full flex flex-col cursor-pointer hover:bg-accent/50 transition-colors border-2">
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <PlusIcon className="h-12 w-12" />
          <span className="text-sm font-medium">Add Recipe</span>
        </div>
        <CardHeader className="flex-shrink-0"></CardHeader>
      </Card>
    </EditRecipeDialogProvider>
  );
}

function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const [isRecipeOnCounter, setIsRecipeOnCounter] = useAtom(
    atom(
      (get) =>
        get(recipesOnCounterAtom).find((r) => r.id === recipe.id) !== undefined,
      (get, set, newValue) => {
        const recipesOnCounter = get(recipesOnCounterAtom);
        if (newValue) {
          set(recipesOnCounterAtom, [...recipesOnCounter, recipe]);
        } else {
          set(
            recipesOnCounterAtom,
            recipesOnCounter.filter((r) => r.id !== recipe.id),
          );
        }
      },
    ),
  );
  return (
    <Card className="h-full flex flex-col pt-0 overflow-hidden">
      <img
        src={recipe.imgUrl}
        alt={recipe.title}
        className="aspect-[4/3] w-full object-cover rounded-t-lg"
      />
      <CardHeader className="flex-shrink-0 px-6 pt-6">
        <CardTitle className="font-bold">{recipe.title}</CardTitle>
        <div className="relative h-16 overflow-hidden">
          <CardDescription className="absolute inset-0">
            {recipe.description}
          </CardDescription>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent" />
        </div>
      </CardHeader>
      <CardFooter className="mt-auto flex justify-start gap-2">
        <EditRecipeDialogProvider recipe={recipe}>
          <Button variant="outline" size="lg">
            <PencilIcon className="h-4 w-4" />
          </Button>
        </EditRecipeDialogProvider>
        {isRecipeOnCounter ? (
          <Button
            variant="default"
            size="lg"
            className="ml-auto"
            onClick={() => setIsRecipeOnCounter(false)}
          >
            <Check className="h-4 w-4 mr-2" />
            Cook
          </Button>
        ) : (
          <Button
            variant="default"
            size="lg"
            className="ml-auto"
            onClick={() => setIsRecipeOnCounter(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Cook
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function RecipesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
        <AddRecipeCard />
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
